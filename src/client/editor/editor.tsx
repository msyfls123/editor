import { ExtensionComponent } from '@lexical/react/ExtensionComponent'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer'
import { TreeViewExtension } from '@lexical/react/TreeViewExtension'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { useMemo, type ReactNode } from 'react'

import { TableToolbarPlugin } from '@/editor/plugins/TableToolbarPlugin'
import { createEditorExtension } from './extension'
import { ImageProvider } from './contexts/Image'
import { Toolbar } from './toolbar'

const placeholder = 'Enter some rich text...'

interface EditorProps {
  initialEditorState: string | null
  onSave: (state: string, plainText: string) => void | Promise<void>
  /** Extra toolbar controls (e.g. the version history button). */
  toolbarExtra?: ReactNode
  /**
   * Changes HMR's saved-state key when the same editor is remounted with new
   * initial content (e.g. after restoring a version) in dev.
   */
  hmrId?: string
}

export function EditorInner({ initialEditorState, onSave, toolbarExtra, hmrId }: EditorProps) {
  const extension = useMemo(
    () => createEditorExtension(initialEditorState, { hmrId }),
    [initialEditorState, hmrId],
  )

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <ImageProvider>
        <div className="editor-container my-10 mx-auto rounded-xs text-slate-900 relative leading-5">
          <Toolbar onSave={onSave}>{toolbarExtra}</Toolbar>
          <div className="editor-inner relative">
            <ContentEditable
              className="editor-input min-h-40 w-full border border-t-mist-400 rounded my-2 resize-none caret-slate-900 relative outline-0 px-3 py-4"
              aria-label="Rich text editor"
              aria-placeholder={placeholder}
              placeholder={
                <div className="text-slate-400 overflow-hidden absolute top-4 left-4 select-none inline-block pointer-events-none">{placeholder}</div>
              }
            />
            <TabIndentationPlugin maxIndent={7} />
            <TableToolbarPlugin />
            <ExtensionComponent
              viewClassName='overflow-x-auto'
              lexical:extension={TreeViewExtension}
            />
          </div>
        </div>
      </ImageProvider>
    </LexicalExtensionComposer>
  )
}
