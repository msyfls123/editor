import { useStateFromLocalStorage } from "./hooks/usePersistence";
import { EditorInner } from './editor'
import { ImageProvider } from "./media/Image";

export function Editor() {
  const { loaded, initialState, saveContent } = useStateFromLocalStorage()

  return <div className="">
    <ImageProvider>
    {loaded && <EditorInner initialEditorState={initialState} saveContent={saveContent} />}
    </ImageProvider>
  </div>
}
