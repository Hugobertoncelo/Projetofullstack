"use client";

import { useEffect, useRef } from "react";
import { Message } from "../../types";
import { formatMessageTime, generateAvatar, cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../LoadingSpinner";

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  currentUserId: string;
}

export default function MessagesList({
  messages,
  isLoading,
  currentUserId,
}: MessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
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
          <h3 className="font-medium text-foreground mb-2">No messages yet</h3>
          <p className="text-sm text-muted-foreground">
            Start the conversation by sending a message below.
          </p>
        </div>
      </div>
    );
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  };

  const messageGroups = groupMessagesByDate(messages);

  const isConsecutiveMessage = (
    currentMessage: Message,
    previousMessage: Message | null
  ) => {
    if (!previousMessage) return false;

    const isSameSender = currentMessage.senderId === previousMessage.senderId;
    const timeDiff =
      new Date(currentMessage.createdAt).getTime() -
      new Date(previousMessage.createdAt).getTime();
    const isWithinTimeThreshold = timeDiff < 5 * 60 * 1000; // 5 minutes

    return isSameSender && isWithinTimeThreshold;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4"
    >
      {messageGroups.map(({ date, messages: groupMessages }, groupIndex) => (
        <div key={date} className="space-y-2">
          {/* Date Header */}
          <div className="flex justify-center">
            <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
              {formatDateHeader(date)}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-2">
            {groupMessages.map((message, messageIndex) => {
              const previousMessage =
                messageIndex > 0 ? groupMessages[messageIndex - 1] : null;
              const isOwn = message.senderId === currentUserId;
              const isConsecutive = isConsecutiveMessage(
                message,
                previousMessage
              );
              const showAvatar = !isOwn && !isConsecutive;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: messageIndex * 0.05 }}
                  className={cn(
                    "flex items-end space-x-2",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  {/* Avatar (only for others' messages and not consecutive) */}
                  {!isOwn && (
                    <div className="w-8 h-8 flex-shrink-0">
                      {showAvatar && (
                        <img
                          src={
                            message.sender.avatar ||
                            generateAvatar(
                              message.sender.displayName ||
                                message.sender.username
                            )
                          }
                          alt={
                            message.sender.displayName ||
                            message.sender.username
                          }
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <div
                    className={cn(
                      "max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl",
                      isOwn ? "items-end" : "items-start"
                    )}
                  >
                    {/* Sender name (only for group chats and not consecutive) */}
                    {!isOwn && !isConsecutive && (
                      <div className="text-xs text-muted-foreground mb-1 px-1">
                        {message.sender.displayName || message.sender.username}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={cn(
                        "relative px-3 py-2 rounded-2xl break-words",
                        isOwn
                          ? "bg-primary text-primary-foreground ml-auto rounded-br-md"
                          : "bg-muted text-muted-foreground mr-auto rounded-bl-md",
                        message.type === "SYSTEM" &&
                          "bg-secondary/50 text-secondary-foreground mx-auto text-center text-sm italic"
                      )}
                    >
                      {/* Reply indicator (if replying to another message) */}
                      {message.replyTo && (
                        <div className="border-l-2 border-accent pl-2 mb-2 opacity-75">
                          <div className="text-xs font-medium">
                            {message.replyTo.sender.displayName ||
                              message.replyTo.sender.username}
                          </div>
                          <div className="text-xs truncate">
                            {message.replyTo.content}
                          </div>
                        </div>
                      )}

                      {/* Message content */}
                      <div className="text-sm">
                        {message.isDeleted ? (
                          <em className="text-muted-foreground">
                            This message was deleted
                          </em>
                        ) : (
                          <>
                            {message.content}
                            {message.isEdited && (
                              <span className="text-xs opacity-75 ml-2">
                                (edited)
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div
                        className={cn(
                          "text-xs opacity-75 mt-1",
                          isOwn ? "text-right" : "text-left"
                        )}
                      >
                        {formatMessageTime(message.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Spacer for own messages */}
                  {isOwn && <div className="w-8" />}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
