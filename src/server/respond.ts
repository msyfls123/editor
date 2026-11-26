import type { Context } from 'hono'

export type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 413 | 415 | 500

/** Uniform `/api/*` error envelope: `{ ok: false, code, message }`. */
export function fail(
  c: Context,
  status: ErrorStatus,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
): Response {
  return c.json({ ok: false as const, code, message, ...extra }, status)
}
