"use client";

import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "next-themes";
import {
  Settings,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Menu,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { getInitials } from "../../lib/utils";

interface UserProfileProps {
  onToggleSidebar: () => void;
}

export default function UserProfile({ onToggleSidebar }: UserProfileProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="p-6 border-b border-white/10 rounded-2xl bg-black/50 glass-effect">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onToggleSidebar}
          className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110 lg:hidden pulse-glow"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110 pulse-glow"
          >
            <MoreHorizontal className="w-5 h-5 text-white" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-black/50 glass-effect rounded-2xl shadow-xl border border-white/20 py-2 z-50 backdrop-blur-xl">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-semibold text-white flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Tema
                </p>
                <div className="flex items-center justify-between mt-3 space-x-2">
                  {themeOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTheme(option.value);
                          setShowDropdown(false);
                        }}
                        className={`flex-1 p-2 rounded-xl transition-all duration-300 ${
                          theme === option.value
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white transform scale-105"
                            : "hover:bg-white/10 text-white/70 hover:text-white"
                        }`}
                      >
                        <IconComponent className="w-4 h-4 mx-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <button className="w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center transition-all duration-300">
                <Settings className="w-4 h-4 mr-3" />
                Configurações
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 flex items-center transition-all duration-300"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg pulse-glow">
            {getInitials(user.displayName || user.username)}
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white pulse-glow"></div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg truncate">
            {user.displayName || user.username}
          </h3>
          <p className="text-white/70 text-sm truncate">{user.email}</p>
          <p className="text-white/50 text-xs mt-1">Online</p>
        </div>
      </div>
    </div>
  );
}
