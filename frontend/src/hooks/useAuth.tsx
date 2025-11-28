"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiService } from "../lib/api";
import { socketService } from "../lib/socket";
import { AuthUser } from "../types";
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    twoFactorCode?: string
  ) => Promise<{
    success: boolean;
    requiresTwoFactor?: boolean;
    error?: string;
  }>;
  register: (
    email: string,
    username: string,
    password: string,
    displayName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<AuthUser>) => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
interface AuthProviderProps {
  children: ReactNode;
}
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const isAuthenticated = !!user;
  useEffect(() => {
    checkAuth();
  }, []);
  useEffect(() => {
    if (user) {
      const token = apiService.getToken();
      if (token) {
        socketService.connect(token);
      }
    } else {
      socketService.disconnect();
    }
  }, [user]);
  const checkAuth = async () => {
    try {
      console.log("🔐 Checking authentication...");
      const token = apiService.getToken();
      if (!token) {
        console.log("❌ No token found");
        setIsLoading(false);
        return;
      }
      console.log("🎫 Token found, validating...");
      const response = await apiService.getCurrentUser();
      if (response.success && response.data?.user) {
        console.log("✅ User authenticated:", response.data.user.username);
        setUser(response.data.user);
      } else {
        console.log("❌ Token invalid, clearing...");
        apiService.clearToken();
      }
    } catch (error) {
      console.error("💥 Auth check failed:", error);
      apiService.clearToken();
    } finally {
      setIsLoading(false);
    }
  };
  const login = async (
    email: string,
    password: string,
    twoFactorCode?: string
  ) => {
    try {
      const response = await apiService.login({
        email,
        password,
        twoFactorCode,
      });
      if (response.success) {
        if (response.data?.requiresTwoFactor) {
          return { success: true, requiresTwoFactor: true };
        }
        if (response.data?.token && response.data?.user) {
          apiService.setToken(response.data.token);
          setUser(response.data.user);
          return { success: true };
        }
      }
      return { success: false, error: response.error || "Falha no login" };
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Falha no login",
      };
    }
  };
  const register = async (
    email: string,
    username: string,
    password: string,
    displayName?: string
  ) => {
    try {
      const response = await apiService.register({
        email,
        username,
        password,
        displayName,
      });
      if (response.success && response.data?.token && response.data?.user) {
        apiService.setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.error || "Registration failed" };
    } catch (error: any) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  };
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      apiService.clearToken();
      socketService.disconnect();
      setUser(null);
      router.push("/login");
    }
  };
  const updateUser = (userData: Partial<AuthUser>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };
  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
