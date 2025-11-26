import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiResponse } from "../types";
class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;
  constructor() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const baseURL = `${apiUrl}/api`;
    this.client = axios.create({
      baseURL: baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.setupInterceptors();
  }
  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem("token", token);
  }
  clearToken(): void {
    this.token = null;
    localStorage.removeItem("token");
  }
  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("token");
    }
    return this.token;
  }
  async register(data: {
    email: string;
    username: string;
    displayName?: string;
    password: string;
  }): Promise<ApiResponse> {
    const response = await this.client.post("/auth/register", data);
    return response.data;
  }
  async login(data: {
    email: string;
    password: string;
    twoFactorCode?: string;
  }): Promise<ApiResponse> {
    const response = await this.client.post("/auth/login", data);
    return response.data;
  }
  async logout(): Promise<ApiResponse> {
    const response = await this.client.post("/auth/logout");
    return response.data;
  }
  async getCurrentUser(): Promise<ApiResponse> {
    const response = await this.client.get("/auth/me");
    return response.data;
  }
  async setup2FA(): Promise<ApiResponse> {
    const response = await this.client.post("/auth/setup-2fa");
    return response.data;
  }
  async verify2FA(code: string): Promise<ApiResponse> {
    const response = await this.client.post("/auth/verify-2fa", { code });
    return response.data;
  }
  async disable2FA(password: string, code: string): Promise<ApiResponse> {
    const response = await this.client.post("/auth/disable-2fa", {
      password,
      code,
    });
    return response.data;
  }
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    const response = await this.client.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  }
  async searchUsers(query: string, page = 1, limit = 20): Promise<ApiResponse> {
    const response = await this.client.get("/users/search", {
      params: { query, page, limit },
    });
    return response.data;
  }
  async getUserProfile(userId: string): Promise<ApiResponse> {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }
  async updateProfile(data: {
    displayName?: string;
    avatar?: string;
  }): Promise<ApiResponse> {
    const response = await this.client.put("/users/me", data);
    return response.data;
  }
  async getOnlineUsers(page = 1, limit = 50): Promise<ApiResponse> {
    const response = await this.client.get("/users", {
      params: { page, limit },
    });
    return response.data;
  }
  async getUserStats(): Promise<ApiResponse> {
    const response = await this.client.get("/users/me/stats");
    return response.data;
  }
  async blockUser(userId: string): Promise<ApiResponse> {
    const response = await this.client.post(`/users/${userId}/block`);
    return response.data;
  }
  async unblockUser(userId: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/users/${userId}/block`);
    return response.data;
  }
  async getConversations(page = 1, limit = 20): Promise<ApiResponse> {
    const response = await this.client.get("/conversations", {
      params: { page, limit },
    });
    return response.data;
  }
  async getConversation(conversationId: string): Promise<ApiResponse> {
    const response = await this.client.get(`/conversations/${conversationId}`);
    return response.data;
  }
  async createDirectConversation(userId: string): Promise<ApiResponse> {
    const response = await this.client.post("/conversations/direct", {
      userId,
    });
    return response.data;
  }
  async createGroupConversation(
    name: string,
    userIds: string[]
  ): Promise<ApiResponse> {
    const response = await this.client.post("/conversations/group", {
      name,
      userIds,
    });
    return response.data;
  }
  async addMembersToGroup(
    conversationId: string,
    userIds: string[]
  ): Promise<ApiResponse> {
    const response = await this.client.post(
      `/conversations/${conversationId}/members`,
      { userIds }
    );
    return response.data;
  }
  async removeMemberFromGroup(
    conversationId: string,
    userId: string
  ): Promise<ApiResponse> {
    const response = await this.client.delete(
      `/conversations/${conversationId}/members/${userId}`
    );
    return response.data;
  }
  async updateGroupInfo(
    conversationId: string,
    name: string
  ): Promise<ApiResponse> {
    const response = await this.client.put(`/conversations/${conversationId}`, {
      name,
    });
    return response.data;
  }
  async leaveConversation(conversationId: string): Promise<ApiResponse> {
    const response = await this.client.delete(
      `/conversations/${conversationId}`
    );
    return response.data;
  }
  async getMessages(
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<ApiResponse> {
    const response = await this.client.get(
      `/messages/conversation/${conversationId}`,
      {
        params: { page, limit },
      }
    );
    return response.data;
  }
  async sendMessage(
    conversationId: string,
    data: {
      content: string;
      type?: string;
      replyToId?: string;
    }
  ): Promise<ApiResponse> {
    const response = await this.client.post(
      `/messages/conversation/${conversationId}`,
      data
    );
    return response.data;
  }
  async searchMessages(
    query: string,
    conversationId?: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse> {
    const response = await this.client.get("/messages/search", {
      params: { query, conversationId, page, limit },
    });
    return response.data;
  }
  async editMessage(messageId: string, content: string): Promise<ApiResponse> {
    const response = await this.client.put(`/messages/${messageId}`, {
      content,
    });
    return response.data;
  }
  async deleteMessage(messageId: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/messages/${messageId}`);
    return response.data;
  }
  async getTypingIndicators(conversationId: string): Promise<ApiResponse> {
    const response = await this.client.get(
      `/messages/conversation/${conversationId}/typing`
    );
    return response.data;
  }
  async request(
    method: string,
    url: string,
    data?: any,
    params?: any
  ): Promise<ApiResponse> {
    const response = await this.client.request({
      method,
      url,
      data,
      params,
    });
    return response.data;
  }
}
export const apiService = new ApiService();
if (typeof window !== "undefined") {
  const token = localStorage.getItem("token");
  if (token) {
    apiService.setToken(token);
  }
}
