import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatMessageTime(date: Date | string): string {
  const messageDate = new Date(date);
  if (isToday(messageDate)) {
    return format(messageDate, "HH:mm");
  } else if (isYesterday(messageDate)) {
    return `Yesterday ${format(messageDate, "HH:mm")}`;
  } else {
    return format(messageDate, "dd/MM/yyyy HH:mm");
  }
}
export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
export function formatLastSeen(date: Date | string): string {
  const lastSeenDate = new Date(date);
  if (isToday(lastSeenDate)) {
    return `Last seen today at ${format(lastSeenDate, "HH:mm")}`;
  } else if (isYesterday(lastSeenDate)) {
    return `Last seen yesterday at ${format(lastSeenDate, "HH:mm")}`;
  } else {
    return `Last seen ${format(lastSeenDate, "dd/MM/yyyy")}`;
  }
}
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}
export function generateAvatar(name: string): string {
  const initials = getInitials(name);
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return `https:
    initials
  )}&background=${color.slice(1)}&color=ffffff&size=128&font-size=0.33`;
}
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false);
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return Promise.resolve(successful);
    } catch (error) {
      document.body.removeChild(textArea);
      return Promise.resolve(false);
    }
  }
}
export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}
export function isImageFile(filename: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  return imageExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}
export function getFileExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
}
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
export function sanitizeHtml(html: string): string {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
}
export function detectUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}
export function linkifyText(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(
    urlRegex,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 underline">$1</a>'
  );
}
