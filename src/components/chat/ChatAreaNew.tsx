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
    if (!conversation?.id || !user?.id) return;
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };
    socketService.onMessageReceived(handleNewMessage);
    return () => {
      socketService.offMessageReceived(handleNewMessage);
    };
  }, [conversation?.id, user?.id]);
  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.isGroup) return "Group Chat";
    const otherMembers = conversation.members?.filter((m) => m.id !== user?.id);
    if (otherMembers?.length === 1) {
      return otherMembers[0].username;
    }
    return "Chat";
  };
  useEffect(() => {
    if (conversation?.id) {
      setMessages([]);
      loadMessages();
    }
  }, [conversation?.id]);
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
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
    <div className="flex-1 flex flex-col glass-effect h-full">
      <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold pulse-glow">
              {conversation.isGroup ? (
                <Users className="w-6 h-6" />
              ) : (
                getInitials(getConversationName(conversation))
              )}
            </div>
            {!conversation.isGroup && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white/20 pulse-glow"></div>
            )}
          </div>
          <div>
            <h2 className="font-bold text-white text-xl">
              {getConversationName(conversation)}
            </h2>
            {conversation.isGroup && conversation.members && (
              <p className="text-white/60 text-sm">
                {conversation.members.length} members
              </p>
            )}
            {!conversation.isGroup && (
              <p className="text-green-400 text-sm font-medium">Online</p>
            )}{" "}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <div
          className="flex-1 overflow-y-scroll p-6 custom-scrollbar"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="glass-effect rounded-3xl p-8 max-w-md">
                <MessageCircle className="w-16 h-16 text-purple-300 mx-auto mb-4 pulse-glow" />
                <p className="text-white/80 text-lg mb-2">No messages yet</p>
                <p className="text-white/50 text-sm">
                  Send a message to start the conversation
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
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 pulse-glow">
                          {getInitials(message.sender?.username || "U")}
                        </div>
                      )}{" "}
                      <div className="flex flex-col space-y-1">
                        {!isOwn && (
                          <p className="text-xs text-white/70 font-medium px-1">
                            {message.sender?.username}
                          </p>
                        )}
                        <div
                          className={`px-6 py-4 rounded-3xl backdrop-blur-lg transition-all duration-300 hover:scale-105 ${
                            isOwn
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 message-bubble-shine"
                              : "glass-effect text-white border border-white/10 shadow-lg"
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
                            isOwn ? "text-purple-200" : "text-white/50"
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
          )}{" "}
        </div>
      </div>{" "}
      <div className="p-6 border-t border-white/10 backdrop-blur-lg flex-shrink-0">
        <div className="flex space-x-4 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full px-6 py-4 glass-effect border border-white/20 rounded-3xl text-white placeholder-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 outline-none transition-all duration-300 text-sm resize-none custom-scrollbar"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center min-w-[56px] shadow-lg shadow-purple-500/25 hover:scale-110 pulse-glow"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
