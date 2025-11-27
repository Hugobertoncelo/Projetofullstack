import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { validateJWT, AuthenticatedRequest } from "../middleware/auth";
const router = express.Router();
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, username, displayName, password } = req.body;
    if (!email || !username || !password) {
      throw createError("Email, username and password are required", 400);
    }
    if (password.length < 8) {
      throw createError("Password must be at least 8 characters long", 400);
    }
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (existingUser) {
      throw createError("User with this email or username already exists", 400);
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: displayName || username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    res.status(201).json({
      success: true,
      data: { user, token },
      message: "User registered successfully",
    });
  })
);
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, twoFactorCode } = req.body;
    if (!email || !password) {
      throw createError("Email and password are required", 400);
    }
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw createError("Invalid email or password", 401);
    }
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          message: "2FA code required",
        });
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: twoFactorCode,
        window: 2,
      });
      if (!verified) {
        throw createError("Invalid 2FA code", 401);
      }
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    };
    res.json({
      success: true,
      data: { user: userResponse, token },
      message: "Login successful",
    });
  })
);
router.get(
  "/me",
  validateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      data: { user: req.user },
    });
  })
);
router.post(
  "/setup-2fa",
  validateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const secret = speakeasy.generateSecret({
      name: `Chat App (${req.user!.username})`,
      issuer: "Chat App",
    });
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { twoFactorSecret: secret.base32 },
    });
    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: secret.otpauth_url,
      },
      message:
        "2FA setup initiated. Verify with your authenticator app to enable.",
    });
  })
);
router.post(
  "/verify-2fa",
  validateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { code } = req.body;
    if (!code) {
      throw createError("2FA code is required", 400);
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    if (!user || !user.twoFactorSecret) {
      throw createError("2FA setup not initiated", 400);
    }
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 2,
    });
    if (!verified) {
      throw createError("Invalid 2FA code", 401);
    }
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { twoFactorEnabled: true },
    });
    res.json({
      success: true,
      message: "2FA enabled successfully",
    });
  })
);
router.post(
  "/disable-2fa",
  validateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { password, code } = req.body;
    if (!password || !code) {
      throw createError("Password and 2FA code are required", 400);
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    if (!user) {
      throw createError("User not found", 404);
    }
    if (!(await bcrypt.compare(password, user.password))) {
      throw createError("Invalid password", 401);
    }
    if (user.twoFactorSecret) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: code,
        window: 2,
      });
      if (!verified) {
        throw createError("Invalid 2FA code", 401);
      }
    }
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
    res.json({
      success: true,
      message: "2FA disabled successfully",
    });
  })
);
router.post(
  "/change-password",
  validateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw createError("Current password and new password are required", 400);
    }
    if (newPassword.length < 8) {
      throw createError("New password must be at least 8 characters long", 400);
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw createError("Invalid current password", 401);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    });
    res.json({
      success: true,
      message: "Password changed successfully",
    });
  })
);
router.post(
  "/logout",
  validateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
    });
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  })
);
export { router as authRoutes };
