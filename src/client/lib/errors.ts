import { AuthRequestError } from '@ebichu-cc/auth/client'

/** Turns API failures into a human-readable message. */
export function describeRequestError(error: unknown, fallback = 'Request failed'): string {
  if (error instanceof AuthRequestError) {
    if (error.status === 401) return 'Your session expired. Please sign in again.'
    const payload = error.payload as { message?: unknown } | null
    if (payload && typeof payload.message === 'string' && payload.message) {
      return payload.message
    }
    return error.message || fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
