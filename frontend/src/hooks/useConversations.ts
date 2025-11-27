"use client";
import { useState, useEffect, useCallback } from "react";
import { apiService } from "../lib/api";
import { socketService } from "../lib/socket";
import { Conversation, Message, TypingIndicator } from "../types";
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getConversations();
      if (response.success && response.data?.conversations) {
        console.log(
          "✅ Conversations loaded:",
          response.data.conversations.length
        );
        setConversations(response.data.conversations);
      } else {
        console.error("❌ API Error:", response.error);
        setError(response.error || "Failed to load conversations");
      }
    } catch (error: any) {
      console.error("💥 Error fetching conversations:", error);
      setError("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, []);
  const createDirectConversation = useCallback(async (userId: string) => {
    try {
      console.log("🚀 Creating direct conversation with userId:", userId);
      const response = await apiService.createDirectConversation(userId);
      console.log("📡 API Response:", response);
      if (response.success && response.data?.conversation) {
        const newConversation = response.data.conversation;
        console.log("✅ New conversation created:", {
          id: newConversation.id,
          isGroup: newConversation.isGroup,
          membersCount: newConversation.members?.length,
          hasMessages: !!newConversation.messages,
        });
        setConversations((prev) => {
          const updated = [newConversation, ...prev];
          console.log(
            "📝 Updated conversations list:",
            updated.length,
            "total"
          );
          return updated;
        });
        return newConversation;
      } else {
        console.error("❌ API Error:", response.error);
        throw new Error(response.error || "Failed to create conversation");
      }
    } catch (error: any) {
      console.error("💥 Error creating conversation:", error);
      throw error;
    }
  }, []);
  const createGroupConversation = useCallback(
    async (name: string, userIds: string[]) => {
      try {
        const response = await apiService.createGroupConversation(
          name,
          userIds
        );
        if (response.success && response.data?.conversation) {
          const newConversation = response.data.conversation;
          setConversations((prev) => [newConversation, ...prev]);
          return newConversation;
        } else {
          throw new Error(response.error || "Failed to create group");
        }
      } catch (error: any) {
        console.error("Error creating group:", error);
        throw error;
      }
    },
    []
  );
  const updateConversationLastMessage = useCallback(
    (conversationId: string, message: Message) => {
      setConversations((prev) =>
        prev
          .map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, lastMessage: message, updatedAt: new Date() }
              : conversation
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
      );
    },
    []
  );
  const removeConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.filter((conv) => conv.id !== conversationId)
    );
  }, []);
  const updateConversation = useCallback(
    (updatedConversation: Partial<Conversation> & { id: string }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === updatedConversation.id
            ? { ...conv, ...updatedConversation }
            : conv
        )
      );
    },
    []
  );
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await apiService.leaveConversation(conversationId);
      if (response.success) {
        setConversations((prev) =>
          prev.filter((conversation) => conversation.id !== conversationId)
        );
        return true;
      } else {
        console.error("❌ API Error:", response.error);
        throw new Error(response.error || "Failed to delete conversation");
      }
    } catch (error: any) {
      console.error("💥 Error deleting conversation:", error);
      throw error;
    }
  }, []);
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      console.log("📩 New message received:", message);
      setConversations((prev) =>
        prev
          .map((conv) =>
            conv.id === message.conversationId
              ? {
                  ...conv,
                  lastMessage: message,
                  updatedAt: new Date(),
                  messageCount: (conv.messageCount || 0) + 1,
                }
              : conv
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
      );
    };

    const handleConversationUpdate = (conversation: Conversation) => {
      console.log("🔄 Conversation updated:", conversation.id);
      updateConversation(conversation);
    };

    socketService.onMessageReceived(handleNewMessage);
    socketService.onConversationUpdated(handleConversationUpdate);

    return () => {
      socketService.offMessageReceived(handleNewMessage);
      socketService.offConversationUpdated(handleConversationUpdate);
    };
  }, [updateConversation]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    createDirectConversation,
    createGroupConversation,
    updateConversationLastMessage,
    removeConversation,
    updateConversation,
    deleteConversation,
  };
}
export function useConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getConversation(conversationId);
      if (response.success && response.data?.conversation) {
        setConversation(response.data.conversation);
      } else {
        setError(response.error || "Failed to load conversation");
      }
    } catch (error: any) {
      console.error("Error fetching conversation:", error);
      setError("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);
  const fetchMessages = useCallback(
    async (page = 1, limit = 50) => {
      if (!conversationId) return;
      try {
        setIsLoadingMessages(true);
        setError(null);
        const response = await apiService.getMessages(
          conversationId,
          page,
          limit
        );
        if (response.success && response.data?.messages) {
          const newMessages = response.data.messages;
          if (page === 1) {
            setMessages(newMessages);
          } else {
            setMessages((prev) => [...newMessages, ...prev]);
          }
          setHasMoreMessages(response.data.pagination?.hasNext || false);
        } else {
          setError(response.error || "Failed to load messages");
        }
      } catch (error: any) {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [conversationId]
  );
  const sendMessage = useCallback(
    (content: string, replyToId?: string) => {
      if (!conversationId) return;
      socketService.sendMessage({
        conversationId,
        content,
        type: "TEXT",
        replyToId,
      });
    },
    [conversationId]
  );
  const startTyping = useCallback(() => {
    if (conversationId) {
      socketService.startTyping(conversationId);
    }
  }, [conversationId]);
  const stopTyping = useCallback(() => {
    if (conversationId) {
      socketService.stopTyping(conversationId);
    }
  }, [conversationId]);
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);
  const updateMessage = useCallback((updatedMessage: Message) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
    );
  }, []);
  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);
  useEffect(() => {
    if (conversationId) {
      socketService.joinConversation(conversationId);
      fetchConversation();
      fetchMessages();
      return () => {
        socketService.leaveConversation(conversationId);
        setConversation(null);
        setMessages([]);
        setTypingUsers([]);
      };
    }
  }, [conversationId, fetchConversation, fetchMessages]);
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        addMessage(message);
      }
    };
    socketService.onMessageReceived(handleNewMessage);
    return () => {
      socketService.offMessageReceived(handleNewMessage);
    };
  }, [conversationId, addMessage]);
  useEffect(() => {
    const handleUserTyping = (data: {
      userId: string;
      conversationId: string;
      username: string;
    }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => [
          ...prev.filter((user) => user.userId !== data.userId),
          {
            id: data.userId,
            userId: data.userId,
            conversationId: data.conversationId,
            createdAt: new Date(),
          },
        ]);
      }
    };
    const handleUserStoppedTyping = (data: {
      userId: string;
      conversationId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) =>
          prev.filter((user) => user.userId !== data.userId)
        );
      }
    };
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStoppedTyping(handleUserStoppedTyping);
    return () => {
      socketService.offUserTyping(handleUserTyping);
      socketService.offUserStoppedTyping(handleUserStoppedTyping);
    };
  }, [conversationId]);
  return {
    conversation,
    messages,
    typingUsers,
    isLoading,
    isLoadingMessages,
    hasMoreMessages,
    error,
    sendMessage,
    startTyping,
    stopTyping,
    fetchMessages,
    addMessage,
    updateMessage,
    removeMessage,
  };
}
