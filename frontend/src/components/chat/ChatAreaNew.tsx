"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, Send, MessageCircle, Users } from "lucide-react";
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
  const [typingUsers, setTypingUsers] = useState<
    { userId: string; username: string }[]
  >([]);
  const typingTimeouts = useRef<{ [userId: string]: NodeJS.Timeout }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    if (!conversation?.id || !user?.id) return;
    socketService.joinConversation(conversation.id);
    return () => {
      socketService.leaveConversation(conversation.id);
    };
  }, [conversation?.id, user?.id]);
  useEffect(() => {
    if (!conversation?.id) return;
    // Atualiza o contador de mensagens ao mudar de conversa
    setMessages([]);
    loadMessages();
  }, [conversation?.id]);
  useEffect(() => {
    if (!conversation) return;
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        if (conversation.messageCount !== undefined) {
          conversation.messageCount = (conversation.messageCount || 0) + 1;
        }
      }
    };
    socketService.onMessageReceived(handleNewMessage);
    return () => {
      socketService.offMessageReceived(handleNewMessage);
    };
  }, [conversation, messages]);
  useEffect(() => {
    if (!conversation?.id || !user?.id) return;
    const handleUserTyping = (data: {
      userId: string;
      username: string;
      conversationId: string;
    }) => {
      if (data.userId !== user.id && data.conversationId === conversation.id) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === data.userId)) return prev;
          return [...prev, { userId: data.userId, username: data.username }];
        });
        // Remove typing after 3s if no stopTyping received
        if (typingTimeouts.current[data.userId])
          clearTimeout(typingTimeouts.current[data.userId]);
        typingTimeouts.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) =>
            prev.filter((u) => u.userId !== data.userId)
          );
        }, 3000);
      }
    };
    const handleUserStoppedTyping = (data: {
      userId: string;
      conversationId: string;
    }) => {
      if (data.userId !== user.id && data.conversationId === conversation.id) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        if (typingTimeouts.current[data.userId])
          clearTimeout(typingTimeouts.current[data.userId]);
      }
    };
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStoppedTyping(handleUserStoppedTyping);
    return () => {
      socketService.offUserTyping(handleUserTyping);
      socketService.offUserStoppedTyping(handleUserStoppedTyping);
    };
  }, [conversation?.id, user?.id]);
  const getOtherUser = (conversation: Conversation) => {
    if (!conversation.members || !user?.id) return null;
    return conversation.members.find((m) => m.id !== user.id) || null;
  };
  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.isGroup) return "Group Chat";
    const other = getOtherUser(conversation);
    if (other) return other.displayName || other.username;
    return "Chat";
  };
  const getConversationInitials = (conversation: Conversation) => {
    if (conversation.isGroup) return "";
    const other = getOtherUser(conversation);
    if (other) return getInitials(other.displayName || other.username);
    return "?";
  };
  const loadMessages = async () => {
    if (!conversation?.id) return;
    try {
      setIsLoading(true);
      const response = await apiService.getMessages(conversation.id);
      if (response.success && response.data?.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation?.id) return;
    const messageContent = newMessage.trim();
    setNewMessage("");
    try {
      const response = await apiService.sendMessage(conversation.id, {
        content: messageContent,
        type: "TEXT",
      });

      if (!response.success) {
        console.error("Message send failed:", response);
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageContent);

      // Show user-friendly error
      alert("Erro ao enviar mensagem. Tente novamente.");
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (conversation?.id) {
      if (e.target.value) {
        socketService.startTyping(conversation.id);
      } else {
        socketService.stopTyping(conversation.id);
      }
    }
  };
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center glass-effect rounded-3xl p-12 max-w-md">
          <MessageCircle className="w-20 h-20 text-purple-300 mx-auto mb-6 pulse-glow" />
          <h3 className="text-2xl font-bold text-white mb-4">
            Selecione uma Conversa
          </h3>
          <p className="text-white/60 text-lg">
            Escolha uma conversa existente ou inicie uma nova.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-100 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 shadow-md rounded-b-3xl mb-2">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-3 hover:bg-purple-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 hover:scale-110 shadow-md"
          >
            <Menu className="w-6 h-6 text-purple-600 dark:text-purple-300" />
          </button>
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {conversation.isGroup ? (
                <Users className="w-7 h-7" />
              ) : (
                getConversationInitials(conversation)
              )}
            </div>
            {!conversation.isGroup && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-md"></div>
            )}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-2xl">
              {getConversationName(conversation)}
              {typeof conversation.messageCount === "number" && (
                <span className="ml-2 text-xs text-purple-400 font-normal align-middle bg-white/10 rounded px-2 py-0.5">
                  {conversation.messageCount} msg
                </span>
              )}
            </h2>
            {typingUsers.length > 0 && (
              <div className="text-xs text-purple-400 dark:text-purple-300 mt-1 animate-fadeIn">
                {typingUsers.map((u) => u.username).join(", ")}{" "}
                {typingUsers.length === 1 ? "está" : "estão"} digitando...
              </div>
            )}
            {conversation.isGroup && conversation.members && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {conversation.members.length} membros
              </p>
            )}
            {!conversation.isGroup && (
              <p className="text-green-500 text-sm font-medium">Online</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0 px-2 md:px-8 pb-4">
        <div
          className="flex-1 overflow-y-scroll p-4 md:p-8 custom-scrollbar rounded-3xl bg-white/70 dark:bg-gray-900/70 shadow-inner"
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="glass-effect rounded-3xl p-8 max-w-md">
                <MessageCircle className="w-16 h-16 text-purple-300 mx-auto mb-4 pulse-glow" />
                <p className="text-gray-700 dark:text-white/80 text-lg mb-2">
                  Nenhuma mensagem ainda
                </p>
                <p className="text-gray-400 dark:text-white/50 text-sm">
                  Envie uma mensagem para iniciar a conversa.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => {
                const isOwn = String(message.senderId) === String(user?.id);
                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isOwn ? "justify-end" : "justify-start"
                    } animate-fadeIn`}
                  >
                    <div
                      className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                        isOwn ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      {!isOwn && (
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-md">
                          {getInitials(
                            message.sender?.displayName ||
                              message.sender?.username ||
                              "U"
                          )}
                        </div>
                      )}
                      <div className="flex flex-col space-y-1">
                        {!isOwn && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium px-1">
                            {message.sender?.displayName ||
                              message.sender?.username}
                          </p>
                        )}
                        <div
                          className={`px-6 py-4 rounded-3xl transition-all duration-300 hover:scale-105 shadow-md ${
                            isOwn
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white message-bubble-shine"
                              : "bg-white/90 dark:bg-gray-800/80 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                        <p
                          className={`text-xs ${
                            isOwn ? "text-right" : "text-left"
                          } px-2 ${
                            isOwn
                              ? "text-purple-400"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      <div className="p-4 md:p-8 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 rounded-t-3xl shadow-lg">
        {typingUsers.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-1 animate-fadeIn">
            {typingUsers.map((u) => u.username).join(", ")}{" "}
            {typingUsers.length === 1 ? "está" : "estão"} digitando...
          </div>
        )}
        <div className="flex space-x-4 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full px-6 py-4 glass-effect border border-gray-300 dark:border-gray-700 rounded-3xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 outline-none transition-all duration-300 text-sm resize-none custom-scrollbar bg-white/80 dark:bg-gray-800/80 shadow-md"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center min-w-[56px] shadow-lg hover:scale-110"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
