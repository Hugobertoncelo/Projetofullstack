"use client";

import { useState, useRef, useEffect } from "react";
import {
  Phone,
  Video,
  Info,
  Menu,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
} from "lucide-react";
import { Conversation } from "../../types";
import { useConversation } from "../../hooks/useConversations";
import { useAuth } from "../../hooks/useAuth";
import { getInitials, generateAvatar, formatLastSeen } from "../../lib/utils";
import MessagesList from "./MessagesList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import { motion, AnimatePresence } from "framer-motion";

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
  const {
    messages,
    typingUsers,
    isLoading,
    sendMessage,
    startTyping,
    stopTyping,
  } = useConversation(conversation?.id || null);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-accent rounded-lg transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-medium">Selecione uma Conversa</span>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Bem-vindo ao seu bate-papo
            </h3>
            <p className="text-muted-foreground">
              Selecione uma conversa na barra lateral para começar a enviar
              mensagens ou crie uma nova.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Helper to get the other member (not the current user) in a 1:1 conversation
  const getOtherMember = () => {
    if (!conversation || conversation.isGroup) return null;
    // Exclude the current user from the members array
    return (
      conversation.members.find((member) => member.id !== user?.id) || null
    );
  };

  const getConversationName = () => {
    if (conversation.isGroup) {
      return conversation.name || "Unnamed Group";
    }
    const otherMember = getOtherMember();
    return otherMember?.displayName || otherMember?.username || "Unknown User";
  };

  const getConversationAvatar = () => {
    if (conversation.isGroup) {
      return generateAvatar(conversation.name || "Group");
    }
    const otherMember = getOtherMember();
    return (
      otherMember?.avatar ||
      generateAvatar(
        otherMember?.displayName || otherMember?.username || "User"
      )
    );
  };

  const getConversationStatus = () => {
    if (conversation.isGroup) {
      const activeMembers = conversation.members.filter(
        (m) => m.isOnline
      ).length;
      return `${conversation.members.length} members, ${activeMembers} online`;
    }

    const otherMember = getOtherMember();
    if (!otherMember) return "Unknown";

    if (otherMember.isOnline) {
      return "Online";
    }

    return formatLastSeen(otherMember.lastSeen);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-16 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0"
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-accent rounded-lg transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative">
            <img
              src={getConversationAvatar()}
              alt={getConversationName()}
              className="w-10 h-10 rounded-full object-cover"
            />
            {!conversation.isGroup && getOtherMember()?.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">
              {getConversationName()}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {getConversationStatus()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {!conversation.isGroup && (
            <>
              <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                <Phone className="h-5 w-5" />
              </button>
              <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                <Video className="h-5 w-5" />
              </button>
            </>
          )}
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Info className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <MessagesList
          messages={messages}
          isLoading={isLoading}
          currentUserId={user?.id || ""}
        />

        {/* Typing Indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <TypingIndicator
              typingUsers={typingUsers}
              conversation={conversation}
            />
          )}
        </AnimatePresence>

        {/* Message Input */}
        <MessageInput
          onSendMessage={sendMessage}
          onStartTyping={startTyping}
          onStopTyping={stopTyping}
          disabled={!conversation}
        />
      </div>
    </div>
  );
}
