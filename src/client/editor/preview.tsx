import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useMemo } from 'react'
import { cn } from 'cn'

import { createEditorExtension } from './extension'

function ReadOnlyBridge() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.setEditable(false)
  }, [editor])

  return null
}

/**
 * Renders a stored EditorState with the same extensions as the editor, but
 * read-only and detached from the editable instance's local state.
 */
export function ReadOnlyEditor({
  state,
  className,
}: {
  state: string
  className?: string
}) {
  const extension = useMemo(
    () =>
      createEditorExtension(state, {
        name: 'editor/version-preview',
        namespace: 'version-preview',
        embedded: true,
        // Each preview is a snapshot. HMR restoration would otherwise bring
        // back the first version's state whenever another version is selected.
        hmr: false,
      }),
    [state],
  )

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <ReadOnlyBridge />
      <div className={cn('editor-container text-slate-900 leading-5', className)}>
        <ContentEditable
          className="editor-input relative outline-0 px-3 py-2"
          aria-label="Version preview"
        />
      </div>
    </LexicalExtensionComposer>
  )
}
