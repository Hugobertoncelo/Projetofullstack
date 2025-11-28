"use client";
import { useState, useEffect } from "react";
import { Search, Users, UserPlus, MessageCircle, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../lib/api";
import { getInitials } from "../../lib/utils";
import LoadingSpinner from "../LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
}
interface StartNewChatProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (userId: string) => void;
}
export default function StartNewChat({
  isOpen,
  onClose,
  onStartConversation,
}: StartNewChatProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAvailableUsers();
      if (response.success && response.data?.users) {
        const filteredUsers = response.data.users.filter(
          (u: User) => u.id !== user?.id
        );
        setUsers(filteredUsers);
      } else {
        console.error("❌ Error loading users:", response.error);
      }
    } catch (error) {
      console.error("❌ Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleStartConversation = async (userId: string) => {
    try {
      onStartConversation(userId);
      onClose();
    } catch (error) {
      console.error("❌ Error creating conversation:", error);
    }
  };
  const filteredUsers = users.filter(
    (u) =>
      searchQuery === "" ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background border border-border rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserPlus size={20} className="text-primary" />
              <h2 className="text-lg font-semibold">Iniciar Nova Conversa</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-muted-foreground">
                  Carregando usuários...
                </span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery
                    ? "Nenhum usuário encontrado"
                    : "Nenhum usuário disponível"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery
                    ? "Tente buscar por outro termo"
                    : "Aguarde outros usuários se conectarem"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredUsers.map((targetUser, index) => (
                  <motion.button
                    key={targetUser.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleStartConversation(targetUser.id)}
                    className="w-full p-4 text-left hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {getInitials(
                            targetUser.displayName || targetUser.username
                          )}
                        </div>
                        {targetUser.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {targetUser.displayName || targetUser.username}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          @{targetUser.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {targetUser.isOnline ? (
                            <span className="text-green-600 font-medium">
                              ● Online
                            </span>
                          ) : (
                            `Última vez: ${new Date(
                              targetUser.lastSeen
                            ).toLocaleString()}`
                          )}
                        </p>
                      </div>
                    </div>
                    <MessageCircle size={20} className="text-primary" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              {filteredUsers.length} usuário
              {filteredUsers.length !== 1 ? "s" : ""} disponível
              {filteredUsers.length !== 1 ? "eis" : ""}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
