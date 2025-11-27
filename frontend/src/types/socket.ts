import { Socket } from "socket.io-client";

export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocketWithUser extends Socket {
  userId?: number;
  user?: User;
}
export interface ServerToClientEvents {
  message: (data: any) => void;
  userJoined: (data: any) => void;
  userLeft: (data: any) => void;
  typing: (data: any) => void;
  stopTyping: (data: any) => void;
  conversationUpdated: (data: any) => void;
}
export interface ClientToServerEvents {
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
  sendMessage: (data: any) => void;
  typing: (data: any) => void;
  stopTyping: (data: any) => void;
}
export type SocketIOSocket = SocketWithUser;
