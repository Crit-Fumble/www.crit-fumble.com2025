import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crit-Fumble Gaming — Cloud game servers & Discord session tools",
  description:
    "Cloud-hosted tabletop game servers, Discord session recording, and party tools — pay only for uptime.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
