import {ClipboardDOMImportExtension} from '@lexical/clipboard';
import {
  AutoFocusExtension,
  HMRExtension,
  TabIndentationExtension,
} from '@lexical/extension';
import {HistoryExtension} from '@lexical/history';
import {ExtensionComponent} from '@lexical/react/ExtensionComponent';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalExtensionComposer} from '@lexical/react/LexicalExtensionComposer';
import {TreeViewExtension} from '@lexical/react/TreeViewExtension';
import {RichTextExtension} from '@lexical/rich-text';
import { configExtension, defineExtension } from 'lexical';
import { MdastCommonMarkExtension, MdastExtension, MdastGfmExtension, MdastShortcutsExtension } from '@lexical/mdast'
import { ListExtension } from '@lexical/list'
import { CodeExtension, CodeIndentExtension } from '@lexical/code'
import {TableExtension} from '@lexical/table'

import { Toolbar } from './toolbar';
import { classTheme } from './theme';
import { useMemo } from 'react';
import { ImageExtension } from './plugins/ImageExtension';
import { ImageProvider } from './contexts/Image';
import { LinkExtension } from './plugins/LinkExtension';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TableToolbarPlugin } from '@/editor/plugins/TableToolbarPlugin';
import { DiagramExtension } from '@/editor/plugins/DiagramExtension';

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
      configExtension(HMRExtension, { hot: import.meta.hot ?? null }),
      configExtension(RichTextExtension, {
        escapeFormatTriggers: {
          code: {arrow: true, click: true, enter: true, onlyAtBoundary: true},
        },
      }),
      ClipboardDOMImportExtension,
      HistoryExtension,
      // Let the documentation page keep focus when this example is embedded.
      configExtension(AutoFocusExtension, {
        disabled: isEmbedded,
      }),
      TreeViewExtension,
      // content
      ListExtension,
      CodeExtension,
      MdastCommonMarkExtension,
      MdastGfmExtension,
      MdastExtension,
      MdastShortcutsExtension,
      TableExtension,
      TabIndentationExtension,
      CodeIndentExtension,
      // custom
      ImageExtension,
      LinkExtension,
      DiagramExtension,
    ],
    name: '@lexical/examples/react-rich',
    namespace: 'react-rich',
    theme: classTheme,
  }), [initialEditorState])

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <ImageProvider>
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
  );
}
