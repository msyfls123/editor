import { useCallback } from 'react'

import { toast } from '@/components/ui/toast'
import { EditorInner } from './editor'
import { useStateFromLocalStorage } from './hooks/usePersistence'

export function Editor() {
  const { loaded, initialState, saveContent } = useStateFromLocalStorage()

  const handleSave = useCallback(
    (state: string) => {
      try {
        saveContent(state)
        toast.add({
          type: 'success',
          description: 'Saved locally',
        })
      } catch {
        toast.add({
          type: 'error',
          description: 'Save failed: browser storage is unavailable or full',
        })
      }
    },
    [saveContent],
  )

  return (
    <div>
      {loaded && (
        <EditorInner initialEditorState={initialState} onSave={handleSave} />
      )}
    </div>
  )
}
