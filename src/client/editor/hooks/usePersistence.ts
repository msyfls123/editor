import { useCallback } from "hono/jsx"
import { useEffect, useState } from "react"

const SAVE_KEY = 'EDITOR_STATE'

export const useStateFromLocalStorage = () => {
  const [initialState, setInitialState] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setInitialState(() => localStorage.getItem(SAVE_KEY))
    setTimeout(() => setLoaded(true), 0)
  }, [])

  const saveContent = useCallback((state: string) => {
    localStorage.setItem(SAVE_KEY, state)
  }, [])

  return {
    saveContent,
    loaded,
    initialState,
  }
}
