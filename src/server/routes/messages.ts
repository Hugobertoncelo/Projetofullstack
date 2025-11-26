import express, { Response } from "express";
import { prisma } from "../index";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

// Variable to store Socket.io instance
let socketInstance: any = null;

// Function to set Socket.io instance
export const setSocketInstance = (io: any) => {
  socketInstance = io;
  console.log("✅ Socket.io instance set in message routes");
};

// Get messages for a conversation
router.get(
  "/conversation/:conversationId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Verify user is member of the conversation
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

    // Get messages from database
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

// Search messages
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

// Edit message
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

    // Check if user is the sender
    if (message.senderId !== req.user!.id) {
      throw createError("Unauthorized to edit this message", 403);
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

// Delete message
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

    // Check if user is the sender
    const isOwner = message.senderId === req.user!.id;

    if (!isOwner) {
      throw createError("Unauthorized to delete this message", 403);
    }

    // Soft delete
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

// Send a new message
router.post(
  "/conversation/:conversationId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params;
    const { content, type = "TEXT", replyToId } = req.body;

    if (!content || content.trim().length === 0) {
      throw createError("Message content is required", 400);
    }

    if (content.length > 2000) {
      throw createError("Message content too long (max 2000 characters)", 400);
    }

    // Verify user is member of the conversation
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

    // Verify reply message exists if replyToId is provided
    if (replyToId) {
      const replyMessage = await prisma.message.findFirst({
        where: {
          id: replyToId,
          conversationId,
          isDeleted: false,
        },
      });

      if (!replyMessage) {
        throw createError("Reply message not found", 404);
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        type,
        senderId: req.user!.id,
        conversationId,
        replyToId: replyToId || null,
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
    }); // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }); // Emit message to all members of the conversation via Socket.io
    console.log(
      `📡 API: Emitting message_received to conversation:${conversationId}`
    );
    if (socketInstance) {
      socketInstance
        .to(`conversation:${conversationId}`)
        .emit("message_received", message);
      console.log("✅ Message emitted via Socket.io");
    } else {
      console.log("⚠️ Socket.io instance not available in message route");
    }

    // Emit conversation update to update the conversation list
    const updatedConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
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
    });

    if (updatedConversation) {
      const formattedConversation = {
        ...updatedConversation,
        lastMessage: updatedConversation.messages[0] || null,
      };
      console.log(
        `📡 API: Emitting conversation_updated to conversation:${conversationId}`
      );
      if (socketInstance) {
        socketInstance
          .to(`conversation:${conversationId}`)
          .emit("conversation_updated", formattedConversation);
        console.log("✅ Conversation update emitted via Socket.io");
      } else {
        console.log(
          "⚠️ Socket.io instance not available for conversation update"
        );
      }
    }

    res.status(201).json({
      success: true,
      data: { message },
      message: "Message sent successfully",
    });
  })
);

export { router as messageRoutes };
