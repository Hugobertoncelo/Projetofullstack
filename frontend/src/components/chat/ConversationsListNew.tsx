"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Users,
  MessageCircle,
  Plus,
  Sparkles,
  Hash,
  Trash2,
} from "lucide-react";
import { Conversation, Message } from "../../types";
import { formatMessageTime, getInitials } from "../../lib/utils";
import LoadingSpinner from "../LoadingSpinner";
import StartNewChat from "./StartNewChat";
import { socketService } from "../../lib/socket";
import { useAuth } from "../../hooks/useAuth";

interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onStartNewConversation: (userId: string) => void;
  onDeleteConversation: (id: string) => void;
  isLoading: boolean;
  onNewMessage?: (conversationId: string) => void;
}

export default function ConversationsList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onStartNewConversation,
  onDeleteConversation,
  isLoading,
  onNewMessage,
}: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showStartNewChat, setShowStartNewChat] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const { user } = useAuth();

  // Function to reset unread count for a conversation
  const resetUnreadCount = (conversationId: string) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [conversationId]: 0,
    }));
  };

  // Force reset unread count when conversation changes and is actively being viewed
  useEffect(() => {
    if (selectedConversationId) {
      // Immediate reset
      resetUnreadCount(selectedConversationId);

      // Additional reset after a short delay to ensure messages have loaded
      const timeoutId = setTimeout(() => {
        resetUnreadCount(selectedConversationId);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      console.log("📩 New message in conversations list:", message);
      // Only increment unread count if:
      // 1. Message is not from current user
      // 2. Message is not in currently selected conversation
      if (
        message.senderId !== user?.id &&
        message.conversationId !== selectedConversationId
      ) {
        console.log(
          "📈 Incrementing unread count for:",
          message.conversationId
        );
        setUnreadCounts((prev) => ({
          ...prev,
          [message.conversationId]: (prev[message.conversationId] || 0) + 1,
        }));
      }
      // If message is in selected conversation, ensure count is 0
      else if (message.conversationId === selectedConversationId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.conversationId]: 0,
        }));
      }
    };

    socketService.onMessageReceived(handleNewMessage);

    return () => {
      socketService.offMessageReceived(handleNewMessage);
    };
  }, [user?.id, selectedConversationId]);

  useEffect(() => {
    if (onNewMessage) {
    }
  }, [onNewMessage]);
  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.isGroup) return "Group Chat";
    const members = conversation.members || [];
    if (members.length > 0) {
      return members.map((m) => m.displayName || m.username).join(", ");
    }
    return "Unknown Chat";
  };
  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return "Start a conversation...";
    }
    const prefix = conversation.isGroup
      ? `${conversation.lastMessage.sender?.username}: `
      : "";
    return `${prefix}${conversation.lastMessage.content}`;
  };
  const filteredConversations = conversations.filter((conversation) =>
    getConversationName(conversation)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );
  const handleNewConversation = (userId: string) => {
    onStartNewConversation(userId);
    setShowStartNewChat(false);
  };

  const handleDeleteConversation = (
    e: React.MouseEvent,
    conversationId: string
  ) => {
    e.stopPropagation();
    setShowDeleteConfirm(conversationId);
  };
  const confirmDeleteConversation = (conversationId: string) => {
    onDeleteConversation(conversationId);
    if (selectedConversationId === conversationId) {
      onSelectConversation("");
    }
    setShowDeleteConfirm(null);
  };
  const cancelDeleteConversation = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <div className="flex flex-col h-full">
      {}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Hash className="w-6 h-6 mr-2 text-purple-300" />
            Mensagens
          </h2>
          <button
            onClick={() => setShowStartNewChat(true)}
            className="p-3 modern-btn text-white hover:scale-110 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            type="text"
            placeholder="Pesquisar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 modern-input text-white placeholder-white/50 outline-none"
          />
        </div>
      </div>
      {}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="glass-effect rounded-3xl p-8 max-w-md">
              <MessageCircle className="w-16 h-16 text-purple-300 mx-auto mb-4 pulse-glow" />
              <h3 className="text-xl font-bold text-white mb-3">
                No conversations
              </h3>
              <p className="text-white/60 mb-6">
                Start a new conversation to begin chatting with friends
              </p>
              <button
                onClick={() => setShowStartNewChat(true)}
                className="modern-btn px-6 py-3 text-white font-medium flex items-center mx-auto"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start New Chat
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredConversations.map((conversation, index) => (
              <div
                key={conversation.id}
                className="relative group"
                onMouseEnter={() => setHoveredConversation(conversation.id)}
                onMouseLeave={() => setHoveredConversation(null)}
              >
                <button
                  onClick={() => {
                    onSelectConversation(conversation.id);
                    resetUnreadCount(conversation.id);
                  }}
                  className={`w-full flex items-center p-4 rounded-2xl transition-all duration-300 hover-lift text-left ${
                    selectedConversationId === conversation.id
                      ? "glass-effect border-l-4 border-purple-400 transform scale-105"
                      : "hover:bg-white/10"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative mr-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      {conversation.isGroup ? (
                        <Users className="w-7 h-7" />
                      ) : (
                        getInitials(getConversationName(conversation))
                      )}
                    </div>
                    {!conversation.isGroup && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white/20 pulse-glow"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white truncate text-lg">
                        {getConversationName(conversation)}
                        {typeof conversation.messageCount === "number" && (
                          <span className="ml-2 text-xs text-purple-300 font-normal align-middle bg-white/10 rounded px-2 py-0.5">
                            {conversation.messageCount} msg
                          </span>
                        )}
                      </h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-white/50 flex-shrink-0 ml-2">
                          {formatMessageTime(
                            conversation.lastMessage.createdAt
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 truncate mb-1">
                      {getLastMessagePreview(conversation)}
                    </p>
                    {conversation.isGroup && conversation.members && (
                      <p className="text-xs text-white/50 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {conversation.members.length} members
                      </p>
                    )}
                  </div>
                  {unreadCounts[conversation.id] > 0 && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center ml-3 pulse-glow">
                      {unreadCounts[conversation.id]}
                    </div>
                  )}
                </button>

                {hoveredConversation === conversation.id && (
                  <button
                    onClick={(e) =>
                      handleDeleteConversation(e, conversation.id)
                    }
                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    title="Remover conversa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {showDeleteConfirm === conversation.id && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 rounded-2xl z-50 shadow-2xl border border-gray-700">
                    <p className="text-white text-base font-semibold mb-4">
                      Tem certeza que deseja remover esta conversa?
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={() =>
                          confirmDeleteConversation(conversation.id)
                        }
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
                      >
                        Remover
                      </button>
                      <button
                        onClick={cancelDeleteConversation}
                        className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-400 transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {}
      {showStartNewChat && (
        <StartNewChat
          isOpen={showStartNewChat}
          onClose={() => setShowStartNewChat(false)}
          onStartConversation={handleNewConversation}
        />
      )}
    </div>
  );
}
