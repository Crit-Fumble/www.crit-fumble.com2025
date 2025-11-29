import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StagingBanner } from "@crit-fumble/react";
import { FloatingFumbleBot } from "@/components/FloatingFumbleBot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crit-Fumble Gaming",
  description: "Modern Gaming platform with integrated VTT, Discord Activities, and GM marketplace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`} suppressHydrationWarning>
        <StagingBanner environment={appEnv} />
        {children}
        <FloatingFumbleBot />
      </body>
    </html>
  );
}
