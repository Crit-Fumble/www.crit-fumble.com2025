import { prisma } from "./db"
import { headers } from "next/headers"

/**
 * Get IP address from request headers
 */
export async function getIpFromHeaders(): Promise<string | undefined> {
  const headersList = await headers()

  // Check common headers set by proxies/load balancers
  const forwarded = headersList.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim()
  }

  const realIp = headersList.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  return undefined
}

/**
 * Get user agent from request headers
 */
export async function getUserAgentFromHeaders(): Promise<string | undefined> {
  const headersList = await headers()
  return headersList.get("user-agent") || undefined
}

/**
 * Update session activity tracking
 * Call this on authenticated requests to track last activity
 */
export async function updateSessionActivity(sessionToken: string) {
  try {
    const ip = await getIpFromHeaders()
    const userAgent = await getUserAgentFromHeaders()

    await prisma.session.update({
      where: { sessionToken },
      data: {
        lastActivityAt: new Date(),
        // Only update IP and UA if they exist and are different
        ...(ip && { ipAddress: ip }),
        ...(userAgent && { userAgent }),
      },
    })
  } catch (error) {
    // Don't fail the request if activity tracking fails
    console.error("Failed to update session activity:", error)
  }
}

/**
 * Create immutable session audit log entry
 * Call this when a new session is created
 */
export async function logSessionCreated(
  sessionToken: string,
  playerId: string,
  loginMethod: string,
  expiresAt: Date
) {
  try {
    const ip = await getIpFromHeaders()
    const userAgent = await getUserAgentFromHeaders()

    await prisma.playerSession.create({
      data: {
        playerId,
        sessionToken,
        loginMethod,
        expiresAt,
        ipAddress: ip,
        userAgent,
      },
    })
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error("Failed to log session creation:", error)
  }
}

/**
 * Mark session as logged out in audit log
 */
export async function logSessionLogout(sessionToken: string) {
  try {
    await prisma.playerSession.updateMany({
      where: {
        sessionToken,
        isValid: true,
      },
      data: {
        isValid: false,
        loggedOutAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Failed to log session logout:", error)
  }
}
