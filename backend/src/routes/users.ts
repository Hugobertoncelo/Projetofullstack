import express, { Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";
const router = express.Router();
router.get(
  "/search",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { query, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    if (!query) {
      throw createError("Search query is required", 400);
    }
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: { not: req.user!.id }, 
          },
          {
            OR: [
              {
                username: {
                  contains: String(query),
                },
              },
              {
                displayName: {
                  contains: String(query),
                },
              },
              {
                email: {
                  contains: String(query),
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
      skip: offset,
      take: Number(limit),
      orderBy: [{ isOnline: "desc" }, { lastSeen: "desc" }],
    });
    const totalUsers = await prisma.user.count({
      where: {
        AND: [
          {
            id: { not: req.user!.id },
          },
          {
            OR: [
              {
                username: {
                  contains: String(query),
                },
              },
              {
                displayName: {
                  contains: String(query),
                },
              },
              {
                email: {
                  contains: String(query),
                },
              },
            ],
          },
        ],
      },
    });
    const totalPages = Math.ceil(totalUsers / Number(limit));
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalUsers,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  })
);
router.get(
  "/:userId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        _count: {
          select: {
            sentMessages: true,
            conversations: true,
          },
        },
      },
    });
    if (!user) {
      throw createError("User not found", 404);
    }
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          {
            members: {
              some: { id: req.user!.id },
            },
          },
          {
            members: {
              some: { id: userId },
            },
          },
        ],
      },
      select: { id: true },
    });
    res.json({
      success: true,
      data: {
        user: {
          ...user,
          messageCount: user._count.sentMessages,
          conversationCount: user._count.conversations,
        },
        existingConversationId: existingConversation?.id || null,
      },
    });
  })
);
router.put(
  "/me",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { displayName, avatar } = req.body;
    const updateData: any = {};
    if (displayName !== undefined) {
      if (displayName && displayName.trim().length > 50) {
        throw createError(
          "Display name cannot be longer than 50 characters",
          400
        );
      }
      updateData.displayName = displayName ? displayName.trim() : null;
    }
    if (avatar !== undefined) {
      if (avatar && !isValidUrl(avatar)) {
        throw createError("Invalid avatar URL", 400);
      }
      updateData.avatar = avatar || null;
    }
    if (Object.keys(updateData).length === 0) {
      throw createError("No valid fields provided for update", 400);
    }
    updateData.updatedAt = new Date();
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        email: true,
        isOnline: true,
        lastSeen: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({
      success: true,
      data: { user: updatedUser },
      message: "Profile updated successfully",
    });
  })
);
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const users = await prisma.user.findMany({
      where: {
        AND: [{ id: { not: req.user!.id } }, { isOnline: true }],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
      },
      skip: offset,
      take: Number(limit),
      orderBy: { lastSeen: "desc" },
    });
    const totalOnlineUsers = await prisma.user.count({
      where: {
        AND: [{ id: { not: req.user!.id } }, { isOnline: true }],
      },
    });
    const totalPages = Math.ceil(totalOnlineUsers / Number(limit));
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalOnlineUsers,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  })
);
router.post(
  "/:userId/block",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    if (userId === req.user!.id) {
      throw createError("Cannot block yourself", 400);
    }
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });
    if (!targetUser) {
      throw createError("User not found", 404);
    }
    res.json({
      success: true,
      message: `User ${targetUser.username} blocked successfully`,
    });
  })
);
router.delete(
  "/:userId/block",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    if (userId === req.user!.id) {
      throw createError("Cannot unblock yourself", 400);
    }
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });
    if (!targetUser) {
      throw createError("User not found", 404);
    }
    res.json({
      success: true,
      message: `User ${targetUser.username} unblocked successfully`,
    });
  })
);
router.get(
  "/me/stats",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const [messageCount, conversationCount, totalUsers] = await Promise.all([
      prisma.message.count({
        where: {
          senderId: req.user!.id,
          isDeleted: false,
        },
      }),
      prisma.conversation.count({
        where: {
          members: {
            some: { id: req.user!.id },
          },
        },
      }),
      prisma.user.count(),
    ]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messagesToday = await prisma.message.count({
      where: {
        senderId: req.user!.id,
        isDeleted: false,
        createdAt: {
          gte: today,
        },
      },
    });
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeConversations = await prisma.conversation.count({
      where: {
        members: {
          some: { id: req.user!.id },
        },
        messages: {
          some: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });
    res.json({
      success: true,
      data: {
        stats: {
          totalMessages: messageCount,
          totalConversations: conversationCount,
          activeConversations,
          messagesToday,
          totalUsers: totalUsers - 1, 
        },
      },
    });
  })
);
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
export { router as userRoutes };
