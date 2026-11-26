import { useCallback, useEffect, useState } from 'react'

const SAVE_KEY = 'editor:draft:v1'
const LEGACY_SAVE_KEY = 'EDITOR_STATE'

function readStoredState(): string | null {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(LEGACY_SAVE_KEY)
  } catch {
    return null
  }

  if (!raw) return null

  // Ignore corrupted drafts instead of crashing the editor.
  try {
    JSON.parse(raw)
    return raw
  } catch {
    return null
  }
}

export const useStateFromLocalStorage = () => {
  const [initialState, setInitialState] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setInitialState(readStoredState())
    setLoaded(true)
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
