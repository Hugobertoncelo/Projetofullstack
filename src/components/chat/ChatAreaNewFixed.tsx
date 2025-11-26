"use client";

import { useState, useEffect, useRef } from "react";
import {
  Menu,
  Send,
  MessageCircle,
  Users,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Conversation, Message } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../lib/api";
import { socketService } from "../../lib/socket";
import { getInitials } from "../../lib/utils";
import LoadingSpinner from "../LoadingSpinner";

interface ChatAreaProps {
  conversation: Conversation | undefined;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function ChatArea({
  conversation,
  onToggleSidebar,
  isSidebarOpen,
}: ChatAreaProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  console.log("💬 ChatArea render - conversation:", conversation?.id);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to top function
  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Monitor scroll position to show/hide scroll buttons
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isAtTop = scrollTop <= 50;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      // Calculate scroll progress (0-100)
      const progress =
        scrollHeight > clientHeight
          ? Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
          : 0;
      setScrollProgress(progress);

      setShowScrollToTop(!isAtTop && scrollTop > 200);
      setShowScrollToBottom(!isNearBottom && scrollHeight > clientHeight + 100);

      // Reset unread count when user scrolls to bottom
      if (isNearBottom) {
        setUnreadCount(0);
      }
    }
  };

  useEffect(() => {
    // Scroll to bottom only if user was near bottom
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isNearBottom || messages.length === 1) {
        scrollToBottom();
        setUnreadCount(0);
      }
    }
  }, [messages]);

  // Add scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Add keyboard scroll listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        messagesContainerRef.current &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        const container = messagesContainerRef.current;

        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            container.scrollBy({ top: -100, behavior: "smooth" });
            break;
          case "ArrowDown":
            e.preventDefault();
            container.scrollBy({ top: 100, behavior: "smooth" });
            break;
          case "PageUp":
            e.preventDefault();
            container.scrollBy({
              top: -container.clientHeight * 0.8,
              behavior: "smooth",
            });
            break;
          case "PageDown":
            e.preventDefault();
            container.scrollBy({
              top: container.clientHeight * 0.8,
              behavior: "smooth",
            });
            break;
          case "Home":
            e.preventDefault();
            scrollToTop();
            break;
          case "End":
            e.preventDefault();
            scrollToBottom();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Join/leave conversation
  useEffect(() => {
    if (!conversation?.id || !user?.id) {
      console.log(
        "❌ Não é possível entrar na conversa: conversa ou usuário ausente"
      );
      return;
    }

    console.log(
      "🔌 ChatArea entrando na conversa:",
      conversation.id,
      "para usuário:",
      user.id
    );
    console.log("🔌 Socket conectado?", socketService.isConnected);
    console.log("🔌 Socket ID:", socketService.socketId);

    socketService.joinConversation(conversation.id);

    return () => {
      console.log("🔌 ChatArea saindo da conversa:", conversation.id);
      socketService.leaveConversation(conversation.id);
    };
  }, [conversation?.id, user?.id]);

  // Listen for new messages for this specific conversation
  useEffect(() => {
    if (!conversation?.id || !user?.id) return;

    const handleNewMessage = (message: Message) => {
      console.log("📨 ChatArea recebeu mensagem:", {
        messageId: message.id,
        conversationId: message.conversationId,
        currentConversationId: conversation.id,
        content: message.content,
        socketConnected: socketService.isConnected,
      });

      // Só processar se for para a conversa atual
      if (message.conversationId === conversation.id) {
        console.log("✅ Adicionando mensagem à conversa atual");
        setMessages((prev) => {
          // Verificar duplicatas
          if (prev.some((m) => m.id === message.id)) {
            console.log(
              "⚠️ Mensagem duplicada detectada, ignorando:",
              message.id
            );
            return prev;
          }
          console.log("✅ Mensagem adicionada à conversa");
          return [...prev, message];
        });
      }
    };

    console.log(
      "👂 ChatArea: Configurando listener de mensagens para conversa:",
      conversation.id
    );
    console.log("👂 Socket conectado?", socketService.isConnected);
    socketService.onMessageReceived(handleNewMessage);

    return () => {
      console.log("👂 ChatArea: Removendo listener de mensagens");
      socketService.offMessageReceived(handleNewMessage);
    };
  }, [conversation?.id, user?.id]);

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.isGroup) return "Group Chat";

    // For direct messages, filter out current user from members
    const otherMembers = conversation.members?.filter((m) => m.id !== user?.id);
    if (otherMembers && otherMembers.length > 0) {
      return otherMembers.map((m) => m.displayName || m.username).join(", ");
    }

    return "Unknown Chat";
  };

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversation?.id]);

  const loadMessages = async () => {
    if (!conversation?.id) return;

    try {
      setIsLoading(true);
      console.log("📨 Loading messages for conversation:", conversation.id);

      const response = await apiService.getMessages(conversation.id);
      if (response.success && response.data?.messages) {
        console.log("✅ Messages loaded:", response.data.messages.length);
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error("❌ Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation?.id) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    try {
      console.log("📤 Sending message via API:", {
        conversationId: conversation.id,
        content: messageContent,
        socketConnected: socketService.isConnected,
      });

      // Send via API (this will trigger socket event from backend)
      const response = await apiService.sendMessage(conversation.id, {
        content: messageContent,
      });

      if (response.success && response.data?.message) {
        console.log(
          "✅ Message sent successfully via API:",
          response.data.message.id
        );
        // Don't add to local state - it will be added via socket listener
      } else {
        console.error("❌ Failed to send message:", response.error);
        // Restore message in input if failed
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      // Restore message in input if failed
      setNewMessage(messageContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border bg-card flex items-center px-4">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors mr-3"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold">Chat</h1>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <MessageCircle size={64} className="text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Selecione uma conversa</h2>
          <p className="text-muted-foreground">
            Escolha uma conversa da lista para começar a conversar!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {conversation.isGroup ? (
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Users size={16} className="text-primary" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(getConversationName(conversation))}
              </div>
            )}

            {!conversation.isGroup && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>

          <div>
            <h2 className="font-semibold">
              {getConversationName(conversation)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {conversation.isGroup
                ? `${conversation.members?.length || 0} membros`
                : "Online"}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          ID: {conversation.id.slice(-8)}
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
        style={{ maxHeight: "calc(100vh - 140px)" }}
        ref={messagesContainerRef}
      >
        <div className="p-4 space-y-4 min-h-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-muted-foreground">
                Carregando mensagens...
              </span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Nenhuma mensagem ainda
              </h3>
              <p className="text-muted-foreground">
                Seja o primeiro a enviar uma mensagem nesta conversa!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex message-enter ${
                    message.senderId === user?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    className={`message-bubble ${
                      message.senderId === user?.id
                        ? "sent bg-primary text-primary-foreground"
                        : "received bg-muted text-foreground"
                    } transition-all duration-200 hover:shadow-md`}
                  >
                    {conversation.isGroup && message.senderId !== user?.id && (
                      <p className="text-xs opacity-75 mb-1 font-medium">
                        {message.sender?.displayName ||
                          message.sender?.username ||
                          "Unknown"}
                      </p>
                    )}
                    <p className="text-sm break-words leading-relaxed">
                      {message.content}
                    </p>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Scroll Buttons and Progress Indicator */}
      <div className="fixed bottom-20 right-4 flex flex-col items-end gap-2">
        {/* Scroll Progress Indicator */}
        {messages.length > 5 && (
          <div className="bg-black/20 dark:bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white dark:text-gray-200">
            {scrollProgress}%
          </div>
        )}

        {showScrollToTop && (
          <button
            onClick={scrollToTop}
            className="p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 z-10 group relative"
            title="Voltar ao topo (Home)"
          >
            <ChevronUp size={20} />
            <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Voltar ao topo (Home)
            </div>
          </button>
        )}

        {showScrollToBottom && (
          <button
            onClick={() => {
              scrollToBottom();
              setUnreadCount(0);
            }}
            className="relative p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 z-10 group"
            title="Ir para o final (End)"
          >
            <ChevronDown size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Ir para o final (End)
              {unreadCount > 0 &&
                ` • ${unreadCount} nova${unreadCount > 1 ? "s" : ""}`}
            </div>
          </button>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Envie uma mensagem para ${getConversationName(
                conversation
              )}...`}
              className="w-full min-h-[40px] max-h-32 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              rows={1}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
