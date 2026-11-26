import { createAuth } from '@ebichu-cc/auth'
import type { Auth, VerifiedSession } from '@ebichu-cc/auth'
import { DEFAULT_SESSION_COOKIE } from '@ebichu-cc/auth'
import {
  createD1SessionRepository,
  createD1UserRepository,
} from '@ebichu-cc/auth/d1'
import { createHonoAuth } from '@ebichu-cc/auth/hono'
import type { AuthVariables, HonoAuth } from '@ebichu-cc/auth/hono'
import type { Context, MiddlewareHandler } from 'hono'
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

/** Hono context variables populated by {@link attachSession} / {@link requireSession}. */
export type AppEnv = { Variables: AuthVariables }

const authSdkOptions = {
  getAuth: () => getAuth(),
  allowedOrigins: ALLOWED_AUTH_ORIGINS,
}

// Production reads the shared `__Secure-ebichu_session` cookie (Domain=ebichu.cc).
const productionSdk = createHonoAuth<AppEnv>(authSdkOptions)

// Local dev serves plain http, where browsers reject `__Secure-` cookies, so the
// login worker writes a host-scoped `ebichu_session` cookie instead.
const localSdk = createHonoAuth<AppEnv>({
  ...authSdkOptions,
  cookie: { name: 'ebichu_session', domain: undefined, secure: false },
})

function sdkFor(c: Context): HonoAuth<AppEnv> {
  return c.req.url.startsWith('http:') ? localSdk : productionSdk
}

/** Populates `user`/`session` when a valid cookie exists; never rejects. */
export const attachSession: MiddlewareHandler<AppEnv> = (c, next) =>
  sdkFor(c).attach(c, next)

/** Requires a valid session; responds `401 { error: 'Unauthorized' }` otherwise. */
export const requireSession: MiddlewareHandler<AppEnv> = (c, next) =>
  sdkFor(c).require(c, next)

/** Rejects cross-origin writes while still allowing same-origin and localhost. */
export const requireOrigin: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!isAllowedOrigin(c.req.raw)) {
    return c.json({ ok: false, code: 'FORBIDDEN', message: 'Forbidden origin' }, 403)
  }
  await next()
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
