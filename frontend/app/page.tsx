"use client";
import { useAuth } from "../src/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "../src/components/LoadingSpinner";
import ChatLayout from "../src/components/chat/ChatLayout";
import { apiService } from "../src/lib/api";
export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [showDebugLogin, setShowDebugLogin] = useState(false);
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowDebugLogin(true);
    }
  }, [isAuthenticated, isLoading, router]);
  const handleQuickLogin = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      if (response.success && response.data?.token) {
        apiService.setToken(response.data.token);
        window.location.reload(); 
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!isAuthenticated && showDebugLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Chat Login</h1>
          <div className="space-y-4">
            <button
              onClick={() =>
                handleQuickLogin("test@example.com", "TestPassword123!")
              }
              className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Login as testuser
            </button>
            <button
              onClick={() =>
                handleQuickLogin("alice@example.com", "AlicePassword123!")
              }
              className="w-full px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Login as alice
            </button>
            <button
              onClick={() =>
                handleQuickLogin(
                  "frontend-test@example.com",
                  "FrontendTest123!"
                )
              }
              className="w-full px-4 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
            >
              Login as frontenduser
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full px-4 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              Go to Login Page
            </button>
          </div>
          {user && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">Logged in as: {user.username}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return null;
  }
  return <ChatLayout />;
}
