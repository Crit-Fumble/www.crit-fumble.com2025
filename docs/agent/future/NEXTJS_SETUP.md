# Next.js 15 Setup Guide
## Crit-Fumble Platform - Complete Implementation

This guide sets up Next.js 15 with Auth.js (Discord + World Anvil), Stripe, dark/light themes, and purple branding.

---

## Brand Colors

Based on your existing site, here are the brand colors:

```css
/* Primary Purple */
--crit-purple-primary: #552e66;     /* Main brand color */
--crit-purple-dark: #3d1f4a;        /* Darker shade */
--crit-purple-light: #7a4599;       /* Lighter shade */

/* Gradients */
--crit-gradient: linear-gradient(135deg, #4F46E5 0%, #552e66 100%);
--crit-hero-gradient: linear-gradient(to bottom right, #3B82F6, #552e66);
```

---

## Project Structure

```
www.crit-fumble.com/
├─ src/
│  ├─ app/                          # Next.js 15 App Router
│  │  ├─ (auth)/                   # Auth routes group
│  │  │  ├─ login/
│  │  │  ├─ register/
│  │  │  └─ verify/
│  │  ├─ (dashboard)/              # Protected dashboard routes
│  │  │  ├─ dashboard/
│  │  │  ├─ campaigns/
│  │  │  ├─ characters/
│  │  │  └─ settings/
│  │  ├─ (shop)/                   # E-commerce routes
│  │  │  ├─ shop/
│  │  │  └─ purchase/
│  │  ├─ api/                      # API routes
│  │  │  ├─ auth/[...nextauth]/   # Auth.js
│  │  │  ├─ trpc/[trpc]/          # tRPC
│  │  │  └─ webhooks/stripe/      # Stripe webhooks
│  │  ├─ layout.tsx               # Root layout
│  │  ├─ page.tsx                 # Homepage
│  │  └─ globals.css              # Global styles
│  │
│  ├─ components/                  # React components
│  │  ├─ ui/                      # Base UI components
│  │  ├─ auth/                    # Auth components
│  │  ├─ navigation/              # Nav components
│  │  └─ providers/               # Context providers
│  │
│  ├─ lib/                         # Utilities
│  │  ├─ auth/                    # Auth.js config
│  │  ├─ db/                      # Prisma client
│  │  ├─ stripe/                  # Stripe client
│  │  └─ utils.ts                 # Helper functions
│  │
│  └─ server/                      # Server-side code
│     ├─ routers/                 # tRPC routers
│     └─ services/                # Business logic
│
├─ prisma/
│  └─ schema.prisma               # Database schema
│
├─ public/                         # Static assets
│  ├─ fonts/
│  └─ img/
│
├─ .env                      # Environment variables
├─ next.config.js
├─ tailwind.config.ts
├─ tsconfig.json
└─ package.json
```

---

## Step 1: Install Dependencies

Create `package.json` if it doesn't exist:

```bash
npm init -y
```

Install all required dependencies:

```bash
# Core Next.js and React
npm install next@latest react@latest react-dom@latest

# TypeScript
npm install -D typescript @types/react @types/node @types/react-dom

# Styling
npm install tailwindcss postcss autoprefixer
npm install -D @tailwindcss/forms @tailwindcss/typography

# Auth.js (formerly NextAuth)
npm install next-auth@beta @auth/prisma-adapter

# Database
npm install @prisma/client
npm install -D prisma

# tRPC
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next
npm install @tanstack/react-query

# Stripe
npm install stripe @stripe/stripe-js

# State Management & Utilities
npm install zustand
npm install zod
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react  # Icons

# World Anvil (your existing package)
# Already in src/packages/worldanvil

# Date handling
npm install date-fns

# Forms
npm install react-hook-form @hookform/resolvers
```

---

## Step 2: Configuration Files

### package.json Scripts

```json
{
  "name": "crit-fumble",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  }
}
```

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Docker
  images: {
    domains: [
      'www.worldanvil.com',
      'cdn.discordapp.com',
      'avatars.githubusercontent.com'
    ],
    formats: ['image/avif', 'image/webp']
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // Webpack config for packages
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src')
    }
    return config
  }
}

module.exports = nextConfig
```

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        crit: {
          purple: {
            DEFAULT: '#552e66',
            50: '#f5f3ff',
            100: '#ede9fe',
            200: '#ddd6fe',
            300: '#c4b5fd',
            400: '#a78bfa',
            500: '#8b5cf6',
            600: '#552e66', // Primary
            700: '#3d1f4a',
            800: '#2e1738',
            900: '#1e0f25',
          },
        },
        // Discord colors
        discord: {
          DEFAULT: '#5865F2',
          dark: '#4752C4',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-rubik)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'crit-gradient': 'linear-gradient(135deg, #4F46E5 0%, #552e66 100%)',
        'crit-hero': 'linear-gradient(to bottom right, #3B82F6, #552e66)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

export default config
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Step 3: Prisma Schema

Create `prisma/schema.prisma`:

```prisma
// This is a minimal version - use DATABASE_SCHEMA.md for complete schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Player {
  id                      String    @id @default(uuid())
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  deletedAt               DateTime? @map("deleted_at")

  // User info
  username                String    @unique
  email                   String?   @unique

  // Discord
  discordId               String    @unique @map("discord_id")
  discordUsername         String?   @map("discord_username")
  discordAvatar           String?   @map("discord_avatar")

  // World Anvil
  worldAnvilId            String?   @unique @map("world_anvil_id")
  worldAnvilUsername      String?   @map("world_anvil_username")
  worldAnvilToken         String?   @map("world_anvil_token") // Encrypted
  worldAnvilRefreshToken  String?   @map("world_anvil_refresh_token") // Encrypted

  // Stripe
  stripeCustomerId        String?   @unique @map("stripe_customer_id")

  // Settings
  settings                Json      @default("{}")

  // Status
  isActive                Boolean   @default(true) @map("is_active")
  lastLoginAt             DateTime? @map("last_login_at")

  // Relations
  accounts                Account[]
  sessions                Session[]
  coinTransactions        CritCoinTransaction[]

  @@map("players")
}

model Account {
  id                String  @id @default(uuid())
  playerId          String  @map("player_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique @map("session_token")
  playerId     String   @map("player_id")
  expires      DateTime

  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

model CritCoinTransaction {
  id                      String    @id @default(uuid())
  createdAt               DateTime  @default(now()) @map("created_at")

  playerId                String    @map("player_id")
  transactionType         String    @map("transaction_type") // 'credit' or 'debit'
  amount                  Int
  balanceAfter            Int       @map("balance_after")
  description             String

  stripePaymentIntentId   String?   @map("stripe_payment_intent_id")
  expiresAt               DateTime? @map("expires_at")

  player Player @relation(fields: [playerId], references: [id])

  @@index([playerId])
  @@index([createdAt])
  @@map("crit_coin_transactions")
}

// Add more tables as needed from DATABASE_SCHEMA.md
```

Initialize Prisma:

```bash
npx prisma generate
npx prisma db push
```

---

## Step 4: Auth.js Configuration

Create `src/lib/auth/config.ts`:

```typescript
import NextAuth, { DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import DiscordProvider from "next-auth/providers/discord"
import { prisma } from "@/lib/db"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      discordId: string
      worldAnvilId?: string
      stripeCustomerId?: string
    } & DefaultSession["user"]
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds"
        }
      }
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const player = await prisma.player.findUnique({
          where: { id: user.id }
        })

        session.user.id = user.id
        session.user.discordId = player?.discordId || ""
        session.user.worldAnvilId = player?.worldAnvilId || undefined
        session.user.stripeCustomerId = player?.stripeCustomerId || undefined
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord") {
        // Update or create player with Discord info
        await prisma.player.upsert({
          where: { discordId: account.providerAccountId },
          update: {
            discordUsername: (profile as any).username,
            discordAvatar: (profile as any).avatar,
            lastLoginAt: new Date()
          },
          create: {
            discordId: account.providerAccountId,
            discordUsername: (profile as any).username,
            discordAvatar: (profile as any).avatar,
            username: (profile as any).username,
            email: user.email,
            lastLoginAt: new Date()
          }
        })
      }
      return true
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "database"
  }
})
```

Create API route `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth/config"

export const { GET, POST } = handlers
```

---

## Step 5: Theme Provider

Create `src/components/providers/theme-provider.tsx`:

```typescript
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

---

## Step 6: Root Layout

Update `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter, Rubik } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
})

export const metadata: Metadata = {
  title: 'Crit-Fumble - TTRPG Platform',
  description: 'Virtual tabletop RPG platform with AI-powered game mastering',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${rubik.variable} font-sans antialiased min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## Step 7: Update globals.css

Update `src/app/globals.css` with purple theme:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --crit-purple-primary: #552e66;
    --crit-purple-dark: #3d1f4a;
    --crit-purple-light: #7a4599;
  }

  /* Font faces from existing setup */
  @font-face {
    font-family: "Rubik";
    src: url("/fonts/Rubik-VariableFont_wght.ttf") format("truetype-variations");
    font-weight: 1 999;
    font-display: swap;
  }
}

@layer components {
  .btn-primary {
    @apply bg-crit-purple-600 hover:bg-crit-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors;
  }

  .btn-secondary {
    @apply bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium px-4 py-2 rounded-lg transition-colors;
  }

  .card {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm;
  }
}
```

---

This is the foundation. Continue in implementation files for:
- Stripe integration
- World Anvil OAuth
- tRPC setup
- Component library
- Dashboard pages

See the next sections for complete implementation...
