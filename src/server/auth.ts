import { createAuth } from '@ebichu-cc/auth'
import type { Auth, VerifiedSession } from '@ebichu-cc/auth'
import { DEFAULT_SESSION_COOKIE } from '@ebichu-cc/auth'
import {
  createD1SessionRepository,
  createD1UserRepository,
} from '@ebichu-cc/auth/d1'
import type { Context } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'
import { env } from 'cloudflare:workers'

const SESSION_COOKIE_NAMES = [DEFAULT_SESSION_COOKIE.name, 'ebichu_session'] as const
const ALLOWED_AUTH_ORIGINS = new Set([
  'https://ebichu.cc',
  'https://login.ebichu.cc',
  'https://editor.ebichu.cc',
])

/** Builds the auth service around the shared `auth` D1 database. */
export function getAuth(): Auth {
  return createAuth({
    users: createD1UserRepository(env.AUTH_DB),
    sessions: createD1SessionRepository(env.AUTH_DB),
  })
}

export function readSessionToken(c: Context): string | undefined {
  for (const name of SESSION_COOKIE_NAMES) {
    const token = getCookie(c, name)
    if (token) return token
  }
  return undefined
}

export async function getSession(c: Context): Promise<VerifiedSession | null> {
  const token = readSessionToken(c)
  return token ? getAuth().verify(token) : null
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin')
  if (!origin) return false

  const normalized = origin.toLowerCase()
  if (normalized === new URL(request.url).origin.toLowerCase()) return true
  if (ALLOWED_AUTH_ORIGINS.has(normalized)) return true

  try {
    const url = new URL(origin)
    return url.protocol === 'http:' && isLocalHost(url.hostname)
  } catch {
    return false
  }
}

export function clearSessionCookies(c: Context): void {
  for (const name of SESSION_COOKIE_NAMES) {
    const isProduction = name === DEFAULT_SESSION_COOKIE.name
    deleteCookie(c, name, {
      path: DEFAULT_SESSION_COOKIE.path,
      secure: isProduction,
      httpOnly: true,
      sameSite: DEFAULT_SESSION_COOKIE.sameSite,
      ...(isProduction ? { domain: DEFAULT_SESSION_COOKIE.domain } : {}),
    })

    // Also clear a host-only cookie, e.g. preview deployments with COOKIE_DOMAIN="".
    if (isProduction) {
      deleteCookie(c, name, {
        path: DEFAULT_SESSION_COOKIE.path,
        secure: true,
        httpOnly: true,
        sameSite: DEFAULT_SESSION_COOKIE.sameSite,
      })
    }
  }
}
