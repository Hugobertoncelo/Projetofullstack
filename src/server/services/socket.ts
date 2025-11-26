import { Server, Socket } from "socket.io";
import { prisma } from "../index";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    displayName?: string | null;
    avatar?: string | null;
  };
}

export const socketHandler = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;

    if (!authSocket.user) {
      socket.disconnect();
      return;
    }

    console.log(`👤 User ${authSocket.user.username} connected`);

    // Update user online status
    await prisma.user.update({
      where: { id: authSocket.user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    // Join user to their personal room
    socket.join(`user:${authSocket.user.id}`);

    // Get user's conversations and join their rooms
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { id: authSocket.user.id },
        },
      },
    });

    conversations.forEach((conversation) => {
      socket.join(`conversation:${conversation.id}`);
    }); // Handle joining a conversation
    socket.on("join_conversation", async (conversationId: string) => {
      try {
        // Verify user is member of the conversation
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            members: {
              some: { id: authSocket.user!.id },
            },
          },
        });

        if (conversation) {
          socket.join(`conversation:${conversationId}`);
          console.log(
            `📝 User ${
              authSocket.user!.username
            } joined conversation ${conversationId}`
          );
        }
      } catch (error) {
        console.error("Error joining conversation:", error);
      }
    }); // Handle leaving a conversation
    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(
        `📤 User ${
          authSocket.user!.username
        } left conversation ${conversationId}`
      );
    }); // Handle sending a message
    socket.on("send_message", async (messageData: any) => {
      try {
        // Verify user is member of the conversation
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: messageData.conversationId,
            members: {
              some: { id: authSocket.user!.id },
            },
          },
        });

        if (!conversation) {
          socket.emit("error", {
            message: "Conversation not found or unauthorized",
          });
          return;
        }

        // Create the message
        const message = await prisma.message.create({
          data: {
            content: messageData.content,
            type: messageData.type || "TEXT",
            senderId: authSocket.user!.id,
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
        }); // Update conversation's last message
        await prisma.conversation.update({
          where: { id: messageData.conversationId },
          data: { updatedAt: new Date() },
        }); // Emit message to all members of the conversation
        console.log(
          `📡 Emitting message_received to conversation:${messageData.conversationId}`
        );
        io.to(`conversation:${messageData.conversationId}`).emit(
          "message_received",
          message
        );

        // Also emit conversation update to update the conversation list
        const updatedConversation = await prisma.conversation.findUnique({
          where: { id: messageData.conversationId },
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
            `📡 Emitting conversation_updated to conversation:${messageData.conversationId}`
          );
          // Emit to all conversation members
          io.to(`conversation:${messageData.conversationId}`).emit(
            "conversation_updated",
            formattedConversation
          );
        }

        console.log(
          `📨 Message sent to conversation ${messageData.conversationId}:`,
          message.content
        );
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on("typing", async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;

        // Emit to other users in the conversation
        socket.to(`conversation:${conversationId}`).emit("typing", {
          userId: authSocket.user!.id,
          username: authSocket.user!.username,
          conversationId,
        });
      } catch (error) {
        console.error("Error handling typing:", error);
      }
    });

    // Handle stop typing
    socket.on("stopTyping", async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;

        // Emit to other users in the conversation
        socket.to(`conversation:${conversationId}`).emit("stopTyping", {
          userId: authSocket.user!.id,
          conversationId,
        });
      } catch (error) {
        console.error("Error handling stop typing:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`👋 User ${authSocket.user!.username} disconnected`);

      try {
        // Update user offline status
        await prisma.user.update({
          where: { id: authSocket.user!.id },
          data: {
            isOnline: false,
            lastSeen: new Date(),
          },
        });
      } catch (error) {
        console.error("Error updating user offline status:", error);
      }
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });
};
