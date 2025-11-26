import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { SocketIOSocket } from "../types/socket";
import { authRoutes } from "./routes/auth";
import { messageRoutes, setSocketInstance } from "./routes/messages-simple";
import { conversationRoutes } from "./routes/conversations";
import { userRoutes } from "./routes/users";
import { socketHandler } from "./services/socket-simple";
import { errorHandler } from "./middleware/errorHandler";
import { validateJWT } from "./middleware/auth";
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
export const prisma = new PrismaClient();
export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;
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
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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
