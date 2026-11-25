import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser } from '@ebichu-cc/auth'
import { AuthRequestError, authJson } from '@ebichu-cc/auth/client'

import { toast } from '@/components/ui/toast'

interface MeResponse {
  user: AuthUser
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: AuthUser }

interface AuthContextValue {
  state: AuthState
  loggingOut: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let cancelled = false

    authJson<MeResponse>('/api/me')
      .then((payload) => {
        if (!cancelled) {
          setState({ status: 'authenticated', user: payload.user })
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return

        if (error instanceof AuthRequestError && error.status === 401) {
          setState({ status: 'anonymous' })
          return
        }

        setState({ status: 'anonymous' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  const logout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await authJson('/api/logout', { method: 'POST' })
      setState({ status: 'anonymous' })
    } catch (error) {
      toast.add({
        type: 'error',
        description: error instanceof Error ? error.message : '退出登录失败，请重试',
      })
    } finally {
      setLoggingOut(false)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ state, loggingOut, logout }),
    [state, loggingOut, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
