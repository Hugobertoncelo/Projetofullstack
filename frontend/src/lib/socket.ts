import { io, Socket } from "socket.io-client";
import { SocketEvents } from "../types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const DEBUG = process.env.NODE_ENV === "development";

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageListeners = new Map<Function, (...args: any[]) => void>();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {});

    this.socket.on("connect_error", (error) => {
      this.handleReconnect();
    });

    this.socket.on("error", (error) => {});
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;

    setTimeout(() => {
      this.socket?.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(message: {
    conversationId: string;
    content: string;
    type?: string;
    replyToId?: string;
  }): void {
    this.socket?.emit("send_message", message);
  }

  onMessageReceived(callback: (message: any) => void): void {
    const wrapper = (message: any) => {
      callback(message);
    };

    this.messageListeners.set(callback, wrapper);
    this.socket?.on("message_received", wrapper);
  }

  offMessageReceived(callback: (message: any) => void): void {
    const wrapper = this.messageListeners.get(callback);
    if (wrapper) {
      this.socket?.off("message_received", wrapper);
      this.messageListeners.delete(callback);
    }
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit("join_conversation", conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit("leave_conversation", conversationId);
  }

  startTyping(conversationId: string): void {
    this.socket?.emit("start_typing", conversationId);
  }

  stopTyping(conversationId: string): void {
    this.socket?.emit("stop_typing", conversationId);
  }

  onUserTyping(
    callback: (data: {
      userId: string;
      conversationId: string;
      username: string;
    }) => void
  ): void {
    this.socket?.on("user_typing", callback);
  }

  onUserStoppedTyping(
    callback: (data: { userId: string; conversationId: string }) => void
  ): void {
    this.socket?.on("user_stopped_typing", callback);
  }

  offUserTyping(
    callback: (data: {
      userId: string;
      conversationId: string;
      username: string;
    }) => void
  ): void {
    this.socket?.off("user_typing", callback);
  }

  offUserStoppedTyping(
    callback: (data: { userId: string; conversationId: string }) => void
  ): void {
    this.socket?.off("user_stopped_typing", callback);
  }

  onUserOnline(callback: (userId: string) => void): void {
    this.socket?.on("user_online", callback);
  }

  onUserOffline(callback: (userId: string) => void): void {
    this.socket?.on("user_offline", callback);
  }

  offUserOnline(callback: (userId: string) => void): void {
    this.socket?.off("user_online", callback);
  }

  offUserOffline(callback: (userId: string) => void): void {
    this.socket?.off("user_offline", callback);
  }

  onConversationUpdated(callback: (conversation: any) => void): void {
    this.socket?.on("conversation_updated", callback);
  }

  offConversationUpdated(callback: (conversation: any) => void): void {
    this.socket?.off("conversation_updated", callback);
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    this.socket?.off("event", callback);
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
