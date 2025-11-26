import { Server, Socket } from 'socket.io';
import { User } from '@prisma/client';

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

export type SocketIOServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type SocketIOSocket = SocketWithUser;
