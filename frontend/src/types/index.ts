export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  emailVerified?: Date;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface Message {
  id: string;
  content: string;
  type: MessageType;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  senderId: string;
  sender: User;
  conversationId: string;
  replyToId?: string;
  replyTo?: Message;
}
export interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
  members: User[];
  messages: Message[];
  lastMessage?: Message;
  messageCount?: number; // total de mensagens na conversa
}
export interface TypingIndicator {
  id: string;
  userId: string;
  conversationId: string;
  createdAt: Date;
}
export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  FILE = "FILE",
  SYSTEM = "SYSTEM",
}
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  twoFactorEnabled: boolean;
}
export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}
export interface RegisterCredentials {
  email: string;
  username: string;
  displayName?: string;
  password: string;
}
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
export interface PaginationParams {
  page: number;
  limit: number;
}
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
export interface SearchParams {
  query: string;
  type?: "messages" | "users" | "conversations";
  conversationId?: string;
}
export interface SocketEvents {
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  send_message: (
    message: Omit<Message, "id" | "createdAt" | "updatedAt" | "sender">
  ) => void;
  start_typing: (conversationId: string) => void;
  stop_typing: (conversationId: string) => void;
  message_received: (message: Message) => void;
  user_typing: (data: {
    userId: string;
    conversationId: string;
    username: string;
  }) => void;
  user_stopped_typing: (data: {
    userId: string;
    conversationId: string;
  }) => void;
  user_online: (userId: string) => void;
  user_offline: (userId: string) => void;
  conversation_updated: (conversation: Conversation) => void;
}
