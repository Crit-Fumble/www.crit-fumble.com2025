import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FloatingFumbleBot } from "@/components/FloatingFumbleBot";
import { Banner } from "@crit-fumble/react/shared";

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
        {appEnv === 'staging' && (
          <Banner variant="warning">
            ⚠️ STAGING ENVIRONMENT - For testing only
          </Banner>
        )}
        {children}
        <FloatingFumbleBot />
      </body>
    </html>
  );
}
