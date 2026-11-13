import { useStateFromLocalStorage } from "./hooks/usePersistence";
import { EditorInner } from './editor'

export function Editor() {
  const { loaded, initialState, saveContent } = useStateFromLocalStorage()

  return <div className="">
    {loaded && <EditorInner initialEditorState={initialState} saveContent={saveContent} />}
  </div>
}
