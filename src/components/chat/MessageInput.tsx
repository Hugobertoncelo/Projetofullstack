"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Smile, Paperclip, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "../../lib/utils";

interface MessageInputProps {
  onSendMessage: (content: string, replyToId?: string) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
  replyToMessage?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  onCancelReply?: () => void;
}

export default function MessageInput({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  disabled = false,
  replyToMessage,
  onCancelReply,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounced typing handlers
  const debouncedStopTyping = useCallback(
    debounce(() => {
      onStopTyping();
      setIsTyping(false);
    }, 1000),
    [onStopTyping]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onStartTyping();
    }

    if (value.trim()) {
      debouncedStopTyping();
    } else if (isTyping) {
      onStopTyping();
      setIsTyping(false);
    }

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage, replyToMessage?.id);
    setMessage("");

    // Stop typing and reset textarea height
    if (isTyping) {
      onStopTyping();
      setIsTyping(false);
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      {/* Reply Preview */}
      <AnimatePresence>
        {replyToMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 bg-muted rounded-lg border-l-4 border-primary"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground mb-1">
                  Replying to {replyToMessage.senderName}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {replyToMessage.content}
                </div>
              </div>
              <button
                onClick={onCancelReply}
                className="p-1 hover:bg-accent rounded transition-colors ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Attachment Button */}
        <button
          type="button"
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors flex-shrink-0"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Message Input Container */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled ? "You can't send messages here" : "Type a message..."
            }
            disabled={disabled}
            className="w-full min-h-[44px] max-h-[120px] px-4 py-3 pr-12 bg-muted border border-transparent rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />

          {/* Emoji Button */}
          <button
            type="button"
            className="absolute right-3 bottom-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
            disabled={disabled}
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {/* Input Hint */}
      <div className="text-xs text-muted-foreground mt-2">
        Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd>{" "}
        to send,{" "}
        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
          Shift + Enter
        </kbd>{" "}
        for new line
      </div>
    </div>
  );
}
