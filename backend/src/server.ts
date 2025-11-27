import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { authRoutes } from "./routes/auth.js";
import { messageRoutes, setSocketInstance } from "./routes/messages-simple.js";
import { conversationRoutes } from "./routes/conversations.js";
import { userRoutes } from "./routes/users.js";
import { socketHandler } from "./services/socket-simple.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { validateJWT } from "./middleware/auth.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,  },
});

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
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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
    console.log("✅ Database connected");
    if (redis) {
      await redis.ping();
      console.log("✅ Redis connected");
    } else {
      console.log("⚠️ Redis not configured, using memory fallback");
    }
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Socket.io server ready`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  if (redis) await redis.quit();
  process.exit(0);
});
process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await prisma.$disconnect();
  if (redis) await redis.quit();
  process.exit(0);
});
startServer();
