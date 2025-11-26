"use client";

import { useState, useMemo } from "react";
import { Search, Users, MessageCircle } from "lucide-react";
import { Conversation as BaseConversation } from "../../types";

interface Member {
  id: string;
  displayName?: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

interface LastMessage {
  content: string;
  sender: Member;
  createdAt: string | Date;
  type: string;
  isDeleted?: boolean;
}

interface Conversation extends Omit<BaseConversation, "lastMessage"> {
  otherMembers?: Member[];
  lastMessage?: LastMessage;
}
import {
  formatMessageTime,
  getInitials,
  generateAvatar,
  cn,
} from "../../lib/utils";
import { motion } from "framer-motion";
import LoadingSpinner from "../LoadingSpinner";

interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  isLoading: boolean;
}

export default function ConversationsList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading,
}: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "groups">(
    "all"
  );

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter by tab
    if (activeTab === "direct") {
      filtered = filtered.filter((conv) => !conv.isGroup);
    } else if (activeTab === "groups") {
      filtered = filtered.filter((conv) => conv.isGroup);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        const conversationName: string =
          conv.name ||
          conv.otherMembers
            ?.map((m: Member) => m.displayName || m.username)
            .join(", ") ||
          "Unknown";

        const lastMessageContent = conv.lastMessage?.content || "";

        interface Member {
          id: string;
          displayName?: string;
          username: string;
          avatar?: string;
          isOnline?: boolean;
        }

        interface LastMessage {
          content: string;
          sender: Member;
          createdAt: string | Date;
          type: string;
          isDeleted?: boolean;
        }

        interface FilteredConversation extends Conversation {
          otherMembers?: Member[];
          lastMessage?: LastMessage;
        }

        return (
          conversationName.toLowerCase().includes(query) ||
          lastMessageContent.toLowerCase().includes(query) ||
          conv.otherMembers?.some((member: Member) =>
            (member.displayName || member.username)
              .toLowerCase()
              .includes(query)
          )
        );
      });
    }

    return filtered;
  }, [conversations, activeTab, searchQuery]);

  const getConversationName = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.name || "Unnamed Group";
    }

    const otherMember = conversation.otherMembers?.[0];
    return otherMember?.displayName || otherMember?.username || "Unknown User";
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return generateAvatar(conversation.name || "Group");
    }

    const otherMember = conversation.otherMembers?.[0];
    return (
      otherMember?.avatar ||
      generateAvatar(
        otherMember?.displayName || otherMember?.username || "User"
      )
    );
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return conversation.isGroup ? "Group created" : "Say hello!";
    }

    const message = conversation.lastMessage;
    const senderName = message.sender.displayName || message.sender.username;

    if (message.type === "SYSTEM") {
      return message.content;
    }

    const prefix = conversation.isGroup ? `${senderName}: ` : "";
    const content = message.isDeleted ? "[Message deleted]" : message.content;

    return `${prefix}${content}`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 pr-4 py-2"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-muted/30">
        {[
          { id: "all", label: "All", icon: MessageCircle },
          { id: "direct", label: "Direct", icon: MessageCircle },
          { id: "groups", label: "Groups", icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-colors relative",
              activeTab === tab.id
                ? "text-primary bg-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Start a conversation by clicking the + button above"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation, index) => (
              <motion.button
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "w-full p-4 text-left hover:bg-accent transition-colors relative",
                  selectedConversationId === conversation.id && "bg-accent"
                )}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={getConversationAvatar(conversation)}
                      alt={getConversationName(conversation)}
                      className="avatar-image"
                    />
                    {conversation.isGroup && (
                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        {conversation.members.length}
                      </div>
                    )}
                    {!conversation.isGroup &&
                      conversation.otherMembers?.[0]?.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                      )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {getConversationName(conversation)}
                      </h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {formatMessageTime(
                            conversation.lastMessage.createdAt
                          )}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {getLastMessagePreview(conversation)}
                      </p>

                      {/* Unread indicator (placeholder) */}
                      {false && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-2 flex-shrink-0" />
                      )}
                    </div>

                    {/* Group members preview */}
                    {conversation.isGroup &&
                      conversation.otherMembers &&
                      conversation.otherMembers.length > 0 && (
                        <div className="flex items-center mt-2 space-x-1">
                          {conversation.otherMembers.slice(0, 3).map(
                            (
                              member: {
                                id: string;
                                displayName?: string;
                                username: string;
                                avatar?: string;
                                isOnline?: boolean;
                              },
                              i: number
                            ) => (
                              <img
                                key={member.id}
                                src={
                                  member.avatar ||
                                  generateAvatar(
                                    member.displayName || member.username
                                  )
                                }
                                alt={member.displayName || member.username}
                                className="w-5 h-5 rounded-full border border-background"
                                style={{ marginLeft: i > 0 ? "-4px" : "0" }}
                              />
                            )
                          )}
                          {conversation.otherMembers.length > 3 && (
                            <div className="w-5 h-5 rounded-full bg-muted border border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                              +{conversation.otherMembers.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {/* Selected indicator */}
                {selectedConversationId === conversation.id && (
                  <motion.div
                    layoutId="selectedConversation"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                  />
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
