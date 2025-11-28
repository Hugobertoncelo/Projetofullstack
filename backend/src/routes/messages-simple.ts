import express, { Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import { MessageType } from "@prisma/client";
const router = express.Router();
let socketInstance: any = null;
export const setSocketInstance = (io: any) => {
  socketInstance = io;
};
router.get(
  "/conversation/:conversationId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: { id: req.user!.id },
        },
      },
    });
    if (!conversation) {
      throw createError("Conversation not found or unauthorized", 404);
    }
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: Number(limit),
    });
    const totalMessages = await prisma.message.count({
      where: {
        conversationId,
        isDeleted: false,
      },
    });
    const totalPages = Math.ceil(totalMessages / Number(limit));
    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalMessages,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  })
);
router.get(
  "/search",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { query, conversationId, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    if (!query) {
      throw createError("Search query is required", 400);
    }
    const whereClause: any = {
      content: {
        contains: String(query),
      },
      isDeleted: false,
      conversation: {
        members: {
          some: { id: req.user!.id },
        },
      },
    };
    if (conversationId) {
      whereClause.conversationId = String(conversationId);
    }
    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        conversation: {
          select: {
            id: true,
            name: true,
            isGroup: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: Number(limit),
    });
    const totalResults = await prisma.message.count({ where: whereClause });
    const totalPages = Math.ceil(totalResults / Number(limit));
    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalResults,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  })
);
router.put(
  "/:messageId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { messageId } = req.params;
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      throw createError("Message content is required", 400);
    }
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            members: true,
          },
        },
      },
    });
    if (!message) {
      throw createError("Message not found", 404);
    }
    if (message.senderId !== req.user!.id) {
      throw createError("Unauthorized to edit this message", 403);
    }
    const now = new Date();
    const messageAge = now.getTime() - message.createdAt.getTime();
    const maxAge = 24 * 60 * 60 * 1000;
    if (messageAge > maxAge) {
      throw createError("Cannot edit messages older than 24 hours", 400);
    }
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
    res.json({
      success: true,
      data: { message: updatedMessage },
      message: "Message updated successfully",
    });
  })
);
router.delete(
  "/:messageId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { messageId } = req.params;
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            members: true,
          },
        },
      },
    });
    if (!message) {
      throw createError("Message not found", 404);
    }
    const isOwner = message.senderId === req.user!.id;
    const isMember = message.conversation.members.some(
      (member) => member.id === req.user!.id
    );
    if (!isOwner && !isMember) {
      throw createError("Unauthorized to delete this message", 403);
    }
    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: "[Message deleted]",
        updatedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
    res.json({
      success: true,
      data: { message: deletedMessage },
      message: "Message deleted successfully",
    });
  })
);
router.post(
  "/conversation/:conversationId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params;
    const { content, type = MessageType.TEXT } = req.body;
    if (!content || content.trim().length === 0) {
      throw createError("Message content is required", 400);
    }
    if (content.length > 2000) {
      throw createError("Message content too long (max 2000 characters)", 400);
    }
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: { id: req.user!.id },
        },
      },
    });
    if (!conversation) {
      throw createError("Conversation not found or unauthorized", 404);
    }
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        type,
        senderId: req.user!.id,
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    if (socketInstance) {
      socketInstance
        .to(`conversation:${conversationId}`)
        .emit("message_received", message);
    } else {
    }
    res.status(201).json({
      success: true,
      data: { message },
      message: "Message sent successfully",
    });
  })
);
export { router as messageRoutes };
