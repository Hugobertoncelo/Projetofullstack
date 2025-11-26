import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../hooks/useAuth";
import { ThemeProvider } from "../components/ThemeProvider";
const inter = Inter({ subsets: ["latin"] });
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};
export const metadata: Metadata = {
  title: "RealTime Chat - Secure & Fast Messaging",
  description:
    "A modern real-time chat application with end-to-end encryption, file sharing, and advanced features.",
  keywords: ["chat", "messaging", "real-time", "secure", "communication"],
  authors: [{ name: "Chat Team" }],
  robots: "index, follow",
  openGraph: {
    title: "RealTime Chat - Secure & Fast Messaging",
    description:
      "A modern real-time chat application with end-to-end encryption, file sharing, and advanced features.",
    type: "website",
    locale: "en_US",
    siteName: "RealTime Chat",
  },
  twitter: {
    card: "summary_large_image",
    title: "RealTime Chat - Secure & Fast Messaging",
    description:
      "A modern real-time chat application with end-to-end encryption, file sharing, and advanced features.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
      </head>      <body
        className={`${inter.className} antialiased min-h-screen bg-background`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <main className="flex-1">{children}</main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
