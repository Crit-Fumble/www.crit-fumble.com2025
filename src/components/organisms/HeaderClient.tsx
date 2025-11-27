'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Session } from 'next-auth'
import type { UserTier } from '@/types/user'
import { useTheme } from '@/hooks/useTheme'
import { UserMenu } from '../molecules/UserMenu'

interface UserData {
  username?: string | null
  email?: string | null
  discordAvatar?: string | null
  githubAvatar?: string | null
  tier?: UserTier
  viewAsRole?: string | null
}

interface HeaderClientProps {
  session: Session | null
  critCoinBalance?: number
  isAdmin?: boolean
  isOwner?: boolean
  userData?: UserData | null
  viewAsRole?: string | null
}

export function HeaderClient({ session, critCoinBalance, isAdmin, isOwner, userData, viewAsRole }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isDarkMode, toggleTheme } = useTheme()

  // Get the best available avatar (prioritize Discord, fallback to GitHub)
  const avatar = userData?.discordAvatar || userData?.githubAvatar || null

  return (
    <header className="bg-slate-800 border-b border-slate-700" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" data-testid="logo-link">
              <Image
                src="/img/cfg-logo.jpg"
                alt="Crit Fumble Gaming"
                width={40}
                height={40}
                className="rounded"
                data-testid="logo-image"
              />
              <span className="text-xl font-display font-bold text-crit-purple-400 hidden sm:block">
                Crit Fumble Gaming
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {session?.user ? (
            <>
              <nav className="hidden md:flex items-center gap-6" data-testid="desktop-nav">

                {/* Crit-Coin Balance - Only show if balance exists */}
                {critCoinBalance !== undefined && critCoinBalance > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-crit-purple-600 dark:bg-crit-purple-700 rounded-lg border border-crit-purple-500 dark:border-crit-purple-600" data-testid="crit-coin-balance">
                    <Image
                      src="/img/crit-coin.png"
                      alt="Crit-Coin"
                      width={20}
                      height={20}
                      className="rounded-sm"
                    />
                    <span className="text-white font-bold text-sm">
                      {critCoinBalance.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle theme"
                  data-testid="theme-toggle"
                >
                  {isDarkMode ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  )}
                </button>

                {/* User Menu */}
                <UserMenu
                  username={userData?.username}
                  email={userData?.email}
                  avatar={avatar}
                  isAdmin={isAdmin}
                  isOwner={isOwner}
                  tier={userData?.tier}
                  viewAsRole={viewAsRole as any}
                />
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle menu"
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </>
          ) : (
            <nav className="flex items-center gap-6" data-testid="unauthenticated-nav">
              {/* Theme Toggle for Unauthenticated */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle theme"
                data-testid="theme-toggle-unauthenticated"
              >
                {isDarkMode ? (
                  // Moon icon for dark mode
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ) : (
                  // Sun icon for light mode
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                )}
              </button>

              {/* Sign In Button */}
              <Link
                href="/login"
                className="px-4 py-2 bg-crit-purple-600 hover:bg-crit-purple-700 text-white rounded-lg font-semibold transition-colors text-sm"
                data-testid="sign-in-button"
              >
                Sign In
              </Link>
            </nav>
          )}
        </div>

        {/* Mobile Menu */}
        {session?.user && mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700" data-testid="mobile-menu">
            <nav className="px-4 py-4 space-y-3">
              {/* User Info Section for Mobile */}
              <div className="pb-3 border-b border-slate-700">
                <UserMenu
                  username={userData?.username}
                  email={userData?.email}
                  avatar={avatar}
                  isAdmin={isAdmin}
                  isOwner={isOwner}
                  tier={userData?.tier}
                  viewAsRole={viewAsRole as any}
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors py-2"
                  data-testid="mobile-theme-toggle"
                >
                  {isDarkMode ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span className="text-sm">Dark Mode</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-sm">Light Mode</span>
                    </>
                  )}
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
