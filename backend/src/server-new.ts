import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import session from "express-session";
import jwt from "jsonwebtoken";

// Routes
import { authRoutes } from "./routes/auth";
import { messageRoutes, setSocketInstance } from "./routes/messages-simple";
import { conversationRoutes } from "./routes/conversations";
import { userRoutes } from "./routes/users";

// Middleware
import { socketHandler } from "./services/socket-simple";
import { errorHandler } from "./middleware/errorHandler";
import { validateJWT } from "./middleware/auth";
import {
  sanitizeInput,
  advancedRateLimit,
  securityHeaders,
} from "./middleware/security";

// Configuration
import { setupSwagger } from "./config/swagger";
import Logger, { requestLogger } from "./config/logger";
import { elasticsearchService } from "./config/elasticsearch";
import "./config/queues"; // Initialize queues

// Database
import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";

const app = express();
const server = createServer(app);

// Initialize Swagger Documentation
setupSwagger(app);

// Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3002",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Session configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "fallback-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Security middleware
app.use(securityHeaders);
app.use(sanitizeInput);

// Core middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3002",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-CSRF-Token",
    ],
  })
);

// Request logging
app.use(requestLogger);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use(
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
    message: {
      success: false,
      error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Additional rate limiting for auth endpoints
app.use("/api/auth", advancedRateLimit(20, 15 * 60 * 1000)); // 20 requests per 15 minutes

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: "connected"
 *                     redis:
 *                       type: string
 *                       example: "connected"
 *                     elasticsearch:
 *                       type: string
 *                       example: "connected"
 */
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbStatus = "connected";

    // Check Redis connection
    let redisStatus = "disconnected";
    try {
      if (redis) {
        await redis.ping();
        redisStatus = "connected";
      }
    } catch (error) {
      redisStatus = "disconnected";
    }

    // Check Elasticsearch
    const elasticStatus = elasticsearchService.isAvailable()
      ? "connected"
      : "disconnected";

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        elasticsearch: elasticStatus,
      },
    });
  } catch (error) {
    Logger.error("Health check failed:", error);
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Service unavailable",
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", validateJWT, messageRoutes);
app.use("/api/conversations", validateJWT, conversationRoutes);
app.use("/api/users", validateJWT, userRoutes);

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        isOnline: true,
      },
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    (socket as any).userId = user.id;
    (socket as any).user = user;
    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
});

// Initialize Socket.IO handlers
socketHandler(io);
setSocketInstance(io);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Database connection
    await prisma.$connect();
    Logger.info("✅ Database connected");

    // Redis connection
    if (redis) {
      await redis.ping();
      Logger.info("✅ Redis connected");
    } else {
      Logger.warn("⚠️ Redis not configured, using memory fallback");
    }

    // Start server
    server.listen(PORT, () => {
      Logger.info(`🚀 Server running on port ${PORT}`);
      Logger.info(`📱 Socket.io server ready`);
      Logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      Logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    Logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on("SIGTERM", async () => {
  Logger.info("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  if (redis) await redis.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  Logger.info("SIGINT received, shutting down gracefully");
  await prisma.$disconnect();
  if (redis) await redis.quit();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  Logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  Logger.error("Uncaught Exception:", error);
  process.exit(1);
});

startServer();
