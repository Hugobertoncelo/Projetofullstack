"use client";

import { motion } from "framer-motion";
import {
  TypingIndicator as TypingIndicatorType,
  Conversation,
} from "../../types";
import { generateAvatar } from "../../lib/utils";

interface TypingIndicatorProps {
  typingUsers: TypingIndicatorType[];
  conversation: Conversation;
}

export default function TypingIndicator({
  typingUsers,
  conversation,
}: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  // Get user details for typing users
  const typingMembers = typingUsers
    .map((indicator) =>
      conversation.members.find((member) => member.id === indicator.userId)
    )
    .filter(Boolean);

  const getTypingText = () => {
    if (typingMembers.length === 0) return "";

    if (typingMembers.length === 1) {
      const user = typingMembers[0]!;
      return `${user.displayName || user.username} is typing...`;
    } else if (typingMembers.length === 2) {
      return `${
        typingMembers[0]!.displayName || typingMembers[0]!.username
      } and ${
        typingMembers[1]!.displayName || typingMembers[1]!.username
      } are typing...`;
    } else {
      return `${typingMembers.length} people are typing...`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-2 border-t border-border bg-background/50"
    >
      <div className="flex items-center space-x-3">
        {/* Avatars */}
        <div className="flex -space-x-2">
          {typingMembers.slice(0, 3).map((member) => (
            <img
              key={member!.id}
              src={
                member!.avatar ||
                generateAvatar(member!.displayName || member!.username)
              }
              alt={member!.displayName || member!.username}
              className="w-6 h-6 rounded-full border-2 border-background"
            />
          ))}
        </div>

        {/* Typing text and animation */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {getTypingText()}
          </span>

          {/* Animated dots */}
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-muted-foreground rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
