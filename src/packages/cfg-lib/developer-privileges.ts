/**
 * Developer Privileges
 *
 * Provides developer privilege checking for local development.
 * When all three verified fields (phone, email, discord) match the DEV_ env vars,
 * the user is granted admin privileges in the application.
 *
 * In production, these env vars should be blank, disabling this feature.
 */

import { Player } from '@prisma/client';

/**
 * Check if a user has developer privileges
 *
 * Developer privileges are granted when:
 * 1. All three DEV_ env vars are set (phone, email, discord)
 * 2. All three verified fields on the user match the DEV_ env vars
 *
 * @param player - The player to check
 * @returns true if the player has developer privileges
 */
export function isDeveloper(player: Player | null | undefined): boolean {
  if (!player) return false;

  const devPhone = process.env.DEV_PHONE;
  const devEmail = process.env.DEV_EMAIL;
  const devDiscord = process.env.DEV_DISCORD;

  // If any DEV_ var is missing, no one can be a developer
  if (!devPhone || !devEmail || !devDiscord) {
    return false;
  }

  // Check if all three verified fields match
  return (
    player.verifiedPhone === devPhone &&
    player.verifiedEmail === devEmail &&
    player.verifiedDiscord === devDiscord
  );
}

/**
 * Get the test impersonation values
 * Falls back to DEV_ values if IMPERSONATE_ values are not set
 *
 * @returns Object with phone, email, and discord for testing
 */
export function getTestImpersonation() {
  return {
    phone: process.env.IMPERSONATE_PHONE || process.env.DEV_PHONE || '',
    email: process.env.IMPERSONATE_EMAIL || process.env.DEV_EMAIL || '',
    discord: process.env.IMPERSONATE_DISCORD || process.env.DEV_DISCORD || '',
  };
}

/**
 * Get the developer credentials for comparison
 *
 * @returns Object with phone, email, and discord DEV values
 */
export function getDeveloperCredentials() {
  return {
    phone: process.env.DEV_PHONE || '',
    email: process.env.DEV_EMAIL || '',
    discord: process.env.DEV_DISCORD || '',
  };
}

/**
 * Check if developer mode is enabled
 * (all three DEV_ env vars are set)
 *
 * @returns true if developer mode is enabled
 */
export function isDeveloperModeEnabled(): boolean {
  return !!(
    process.env.DEV_PHONE &&
    process.env.DEV_EMAIL &&
    process.env.DEV_DISCORD
  );
}

/**
 * Check if test impersonation is configured
 *
 * @returns true if at least one IMPERSONATE_ var is set
 */
export function isImpersonationEnabled(): boolean {
  return !!(
    process.env.IMPERSONATE_PHONE ||
    process.env.IMPERSONATE_EMAIL ||
    process.env.IMPERSONATE_DISCORD
  );
}
