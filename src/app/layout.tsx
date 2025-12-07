import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FloatingFumbleBot } from "@/components/FloatingFumbleBot";

const inter = Inter({ subsets: ["latin"] });

// Simple inline StagingBanner to avoid pulling in desktop components
function StagingBanner({ environment }: { environment?: string }) {
  if (environment !== 'staging') return null

  return (
    <div className="bg-yellow-500 text-black text-center py-2 px-4 font-semibold text-sm">
      ⚠️ STAGING ENVIRONMENT - For testing only
    </div>
  )
}

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
