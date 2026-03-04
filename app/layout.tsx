import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reelgen - Generate UGC-style product videos in seconds",
  description: "Create realistic UGC-style product videos using AI avatars and templates optimized for TikTok and Reels ads.",
  icons: {
    icon: "/Reelgen new logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
