import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";
interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
}
export const socketHandler = (io: Server) => {
  io.on("connection", async (socket: AuthenticatedSocket) => {
    if (!socket.user) {
      socket.disconnect();
      return;
    }
    console.log(`👤 User ${socket.user.username} connected`);
    await prisma.user.update({
      where: { id: socket.user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    });
    socket.join(`user:${socket.user.id}`);
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { id: socket.user.id },
        },
      },
    });
    conversations.forEach((conversation) => {
      socket.join(`conversation:${conversation.id}`);
    });
    socket.on("joinConversation", async (conversationId: string) => {
      try {
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            members: {
              some: { id: socket.user!.id },
            },
          },
        });
        if (conversation) {
          socket.join(`conversation:${conversationId}`);
          console.log(
            `📝 User ${
              socket.user!.username
            } joined conversation ${conversationId}`
          );
        }
      } catch (error) {
        console.error("Error joining conversation:", error);
      }
    });
    socket.on("leaveConversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(
        `📤 User ${socket.user!.username} left conversation ${conversationId}`
      );
    });
    socket.on("sendMessage", async (messageData: any) => {
      try {
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: messageData.conversationId,
            members: {
              some: { id: socket.user!.id },
            },
          },
        });
        if (!conversation) {
          socket.emit("error", {
            message: "Conversation not found or unauthorized",
          });
          return;
        }
        const message = await prisma.message.create({
          data: {
            content: messageData.content,
            type: messageData.type || "TEXT",
            senderId: socket.user!.id,
            conversationId: messageData.conversationId,
            replyToId: messageData.replyToId || null,
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
            replyTo: messageData.replyToId
              ? {
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
                }
              : undefined,
          },
        });
        await prisma.conversation.update({
          where: { id: messageData.conversationId },
          data: { updatedAt: new Date() },
        });
        io.to(`conversation:${messageData.conversationId}`).emit("message", {
          message,
          conversationId: messageData.conversationId,
        });
        console.log(
          `💬 Message sent in conversation ${messageData.conversationId}`
        );
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });
    socket.on("typing", async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        socket.to(`conversation:${conversationId}`).emit("typing", {
          userId: socket.user!.id,
          username: socket.user!.username,
          conversationId,
        });
      } catch (error) {
        console.error("Error handling typing:", error);
      }
    });
    socket.on("stopTyping", async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        socket.to(`conversation:${conversationId}`).emit("stopTyping", {
          userId: socket.user!.id,
          conversationId,
        });
      } catch (error) {
        console.error("Error handling stop typing:", error);
      }
    });
    socket.on("disconnect", async () => {
      console.log(`👋 User ${socket.user!.username} disconnected`);
      try {
        await prisma.user.update({
          where: { id: socket.user!.id },
          data: {
            isOnline: false,
            lastSeen: new Date(),
          },
        });
      } catch (error) {
        console.error("Error updating user offline status:", error);
      }
    });
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });
  const cleanup = async () => {
    try {
      console.log("🧹 Running socket cleanup...");
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  };
  setInterval(cleanup, 5 * 60 * 1000);
};
