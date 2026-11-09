import {ClipboardDOMImportExtension} from '@lexical/clipboard';
import {
  AutoFocusExtension,
  EditorStateExtension,
  HMRExtension,
} from '@lexical/extension';
import {HistoryExtension} from '@lexical/history';
import {ExtensionComponent} from '@lexical/react/ExtensionComponent';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalExtensionComposer} from '@lexical/react/LexicalExtensionComposer';
import {TreeViewExtension} from '@lexical/react/TreeViewExtension';
import {RichTextExtension} from '@lexical/rich-text';
import { configExtension, defineExtension } from 'lexical';

import { Toolbar } from './toolbar';
import { classTheme } from './theme';
import { useMemo } from 'react';
import { ImageExtension } from './plugins/ImageExtension';
import { ImageNodePlugin } from './plugins/ImageExtension/ImageNodePlugin';

const placeholder = 'Enter some rich text...';

const isEmbedded = new URLSearchParams(window.location.search).has('embed');

interface EditorProps {
  initialEditorState: string | null
  saveContent: (text: string) => void
}

export function EditorInner({ initialEditorState, saveContent }: EditorProps) {
  const extension = useMemo(() => defineExtension({
    ...(initialEditorState ? {
      $initialEditorState: initialEditorState
    } : {}),
    dependencies: [
      configExtension(HMRExtension, {hot: import.meta.hot ?? null}),
      RichTextExtension,
      ClipboardDOMImportExtension,
      EditorStateExtension,
      HistoryExtension,
      // Let the documentation page keep focus when this example is embedded.
      configExtension(AutoFocusExtension, {
        disabled: isEmbedded,
      }),
      TreeViewExtension,
      ImageExtension,
    ],
    name: '@lexical/examples/react-rich',
    namespace: 'react-rich',
    theme: classTheme,
  }), [initialEditorState])

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <div className="editor-container my-10 mx-auto rounded-xs text-slate-900 relative leading-5">
        <Toolbar onSave={saveContent}/>
        <div className="editor-inner relative">
          <ContentEditable
            className="editor-input min-h-40 max-w-200 border border-t-mist-400 rounded my-2 resize-none caret-slate-900 relative outline-0 px-3 py-4"
            aria-label="Rich text editor"
            aria-placeholder={placeholder}
            placeholder={
              <div className="text-slate-400 overflow-hidden absolute top-4 left-4 select-none inline-block pointer-events-none">{placeholder}</div>
            }
          />
          {/*<ExtensionComponent lexical:extension={TreeViewExtension} />*/}
          <ImageNodePlugin />
        </div>
      </div>
    </LexicalExtensionComposer>
  );
}
