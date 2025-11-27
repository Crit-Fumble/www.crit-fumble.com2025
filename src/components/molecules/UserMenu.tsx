'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { handleSignOut } from '@/app/actions/auth';
import { setViewAsRole, clearViewAsRole } from '@/app/actions/roles';
import type { UserTier, UserRole } from '@/lib/permissions-client';
import { getRoleInfo } from '@/lib/permissions-client';
import { useClickOutside } from '@/hooks';

const ALL_ROLES: UserRole[] = ['Player', 'GameMaster', 'Storyteller', 'Worldbuilder', 'Creator', 'Moderator', 'Admin'];

interface UserMenuProps {
  username?: string | null;
  email?: string | null;
  avatar?: string | null;
  isAdmin?: boolean;
  isOwner?: boolean;
  tier?: UserTier;
  viewAsRole?: UserRole | null;
}

export function UserMenu({ username, email, avatar, isAdmin, isOwner, viewAsRole }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useClickOutside(menuRef, () => setIsOpen(false), isOpen);

  // Get display name
  const displayName = username || email?.split('@')[0] || 'User';

  // Get initials for fallback avatar
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={menuRef} data-testid="user-menu">
      {/* User Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
        data-testid="user-menu-button"
      >
        {/* Avatar */}
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-crit-purple-600 flex items-center justify-center">
          {avatar ? (
            <Image
              src={avatar}
              alt={displayName}
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <span className="text-white text-sm font-semibold">{initials}</span>
          )}
        </div>

        {/* Username */}
        <span className="text-white font-medium text-sm hidden md:block">{displayName}</span>

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform hidden md:block ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50"
          data-testid="user-menu-dropdown"
        >
          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/campaigns"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              data-testid="menu-campaigns"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Campaigns
            </Link>
          </div>

          {/* Admin-only Menu Items */}
          {isAdmin && (
            <div className="border-t border-gray-200 dark:border-slate-700 py-1">
              <Link
                href="/histories"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                data-testid="menu-histories"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Histories
              </Link>

              <Link
                href="/multiverse"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                data-testid="menu-multiverse"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Multiverse
              </Link>

              <Link
                href="/assets"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                data-testid="menu-assets"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Assets
              </Link>

              {/* REMOVED: Features not in March 2026 scope
              - /vtt-platforms - FoundryVTT integration (Phase 5, 2027+)
              - /rpg-systems - Multi-system support (Phase 2, Q2 2026+)
              - /core-concepts - Advanced mechanics (Phase 6, 2027+)
              See: /docs/agent/future/README.md

              Role Hierarchy (Admin-only for now, future roles TBD):
              - Creators: Define RpgAssets (images, documents, etc.) → /assets
              - Worldbuilders: Manage multiverse of worlds using creator assets → /multiverse
              - Storytellers: Write historical events in worlds → /histories
              - Game Masters: Run campaigns using histories, worlds, and assets → /campaigns
              - Players: Play in campaigns (everyone is a player by default)

              Menu Structure:
              Player Section:
              - Campaigns (includes character management)
              Note: Dashboard accessible via logo click

              Admin Section (admin-only for now):
              - Histories (historical events GMs can reference)
              - Multiverse (manage multiverse of worlds using creator assets)
              - Assets (images, documents)
              - Admin (user management)

              Bottom Section:
              - Account
              - Sign Out
              */}

              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                data-testid="menu-admin"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </Link>
            </div>
          )}

          {/* Owner-only Menu Items */}
          {isOwner && (
            <div className="border-t border-gray-200 dark:border-slate-700 py-1">
              <Link
                href="/owners"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                data-testid="menu-owners"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Owner Portal
              </Link>

              {/* View As Role Selector */}
              <div className="px-4 py-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">View As Role:</div>
                {viewAsRole ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleInfo(viewAsRole).color}`}>
                      {getRoleInfo(viewAsRole).name}
                    </span>
                    <button
                      onClick={async () => {
                        setIsChangingRole(true);
                        try {
                          await clearViewAsRole();
                          window.location.reload();
                        } catch (error) {
                          console.error('Failed to clear view as role:', error);
                        } finally {
                          setIsChangingRole(false);
                        }
                      }}
                      disabled={isChangingRole}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <select
                    onChange={async (e) => {
                      const role = e.target.value as UserRole;
                      if (!role) return;
                      setIsChangingRole(true);
                      try {
                        await setViewAsRole(role);
                        window.location.reload();
                      } catch (error) {
                        console.error('Failed to set view as role:', error);
                      } finally {
                        setIsChangingRole(false);
                      }
                    }}
                    disabled={isChangingRole}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white disabled:opacity-50"
                    defaultValue=""
                  >
                    <option value="">Owner (default)</option>
                    {ALL_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {getRoleInfo(role).name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Account & Sign Out */}
          <div className="border-t border-gray-200 dark:border-slate-700 py-1">
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              data-testid="menu-account"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account
            </Link>

            <form action={handleSignOut}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
                data-testid="menu-sign-out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
