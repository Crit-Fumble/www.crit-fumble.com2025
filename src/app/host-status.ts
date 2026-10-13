/**
 * Host reachability, read from the status service.
 *
 * The service has its own hostname because this site is static files only (README,
 * "Static only"): do not move the check onto this site's hostname. It is public
 * data, read with `credentials: 'omit'`.
 *
 * A row's `ok` means the host answered on a public path. For every host but core
 * that proves the edge is up, not the app behind it — so the page says
 * "Reachable", never "Healthy".
 */

export const STATUS_URL = process.env.NEXT_PUBLIC_STATUS_URL ?? 'https://status.critfumble.com/'

export interface HostStatus {
  host: string
  ok: boolean
}

function isHostStatus(row: unknown): row is HostStatus {
  const r = row as HostStatus | null
  return typeof r?.host === 'string' && typeof r?.ok === 'boolean'
}

/** The current rows, or `null` when the status service itself cannot be read. */
export async function fetchHostStatus(): Promise<HostStatus[] | null> {
  try {
    const res = await fetch(STATUS_URL, { credentials: 'omit' })
    if (!res.ok) return null
    const body: unknown = await res.json()
    const hosts = (body as { hosts?: unknown } | null)?.hosts
    return Array.isArray(hosts) ? hosts.filter(isHostStatus) : null
  } catch {
    return null
  }
}
