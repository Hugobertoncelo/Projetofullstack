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

import { authRoutes } from "./routes/auth";
import { messageRoutes, setSocketInstance } from "./routes/messages-simple";
import { conversationRoutes } from "./routes/conversations";
import { userRoutes } from "./routes/users";

import { socketHandler } from "./services/socket-simple";
import { errorHandler } from "./middleware/errorHandler";
import { validateJWT } from "./middleware/auth";
import {
  sanitizeInput,
  advancedRateLimit,
  securityHeaders,
} from "./middleware/security";

import { setupSwagger } from "./config/swagger";
import Logger, { requestLogger } from "./config/logger";
import { elasticsearchService } from "./config/elasticsearch";
import "./config/queues";

import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";

const app = express();
const server = createServer(app);

setupSwagger(app);

const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:3002",
  "http://localhost:3002",
  "https://chat-frontend-2a0i.onrender.com",
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS (Socket.io)"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "fallback-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(securityHeaders);
app.use(sanitizeInput);

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
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
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

app.use(requestLogger);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
    message: {
      success: false,
      error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/api/auth", advancedRateLimit(20, 15 * 60 * 1000));

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbStatus = "connected";

    let redisStatus = "disconnected";
    try {
      if (redis) {
        await redis.ping();
        redisStatus = "connected";
      }
    } catch (error) {
      redisStatus = "disconnected";
    }

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

app.use("/api/auth", authRoutes);
app.use("/api/messages", validateJWT, messageRoutes);
app.use("/api/conversations", validateJWT, conversationRoutes);
app.use("/api/users", validateJWT, userRoutes);

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

socketHandler(io);
setSocketInstance(io);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await prisma.$connect();
    Logger.info("✅ Database connected");

    if (redis) {
      await redis.ping();
      Logger.info("✅ Redis connected");
    } else {
      Logger.warn("⚠️ Redis not configured, using memory fallback");
    }

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

process.on("unhandledRejection", (reason, promise) => {
  Logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  Logger.error("Uncaught Exception:", error);
  process.exit(1);
});

startServer();
