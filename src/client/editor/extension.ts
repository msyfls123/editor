import { ClipboardDOMImportExtension } from '@lexical/clipboard'
import {
  AutoFocusExtension,
  HMRExtension,
  TabIndentationExtension,
} from '@lexical/extension'
import { HistoryExtension } from '@lexical/history'
import { MdastCommonMarkExtension, MdastExtension, MdastGfmExtension, MdastShortcutsExtension } from '@lexical/mdast'
import { ListExtension } from '@lexical/list'
import { CodeExtension, CodeIndentExtension } from '@lexical/code'
import { TableExtension } from '@lexical/table'
import { CodePrismExtension } from '@lexical/code-prism'
import { TreeViewExtension } from '@lexical/react/TreeViewExtension'
import { RichTextExtension } from '@lexical/rich-text'
import { configExtension, defineExtension } from 'lexical'

import { DiagramExtension } from './plugins/DiagramExtension'
import { ImageExtension } from './plugins/ImageExtension'
import { LinkExtension } from './plugins/LinkExtension'
import { classTheme } from './theme'

const isEmbedded = new URLSearchParams(window.location.search).has('embed')

export interface EditorExtensionOptions {
  /** Root extension name; keep unique when several editors are mounted at once. */
  name?: string
  namespace?: string
  /** Disable autofocus (e.g. for read-only previews or embedded editors). */
  embedded?: boolean
  /**
   * Exclude React-only extensions (e.g. TreeView) when building a headless
   * editor without `LexicalExtensionComposer`.
   */
  headless?: boolean
  /**
   * Keep editor state across HMR reloads in dev. Disable it for transient
   * read-only previews: HMRExtension restores the last state saved under the
   * same namespace on every remount, which would shadow `$initialEditorState`.
   */
  hmr?: boolean
  /** Distinguishes editors that deliberately share one namespace in dev. */
  hmrId?: string
}

/** Builds the shared rich-text extension used by the editor and read-only previews. */
export function createEditorExtension(
  initialEditorState?: string | null,
  options: EditorExtensionOptions = {},
) {
  const {
    name = '@lexical/examples/react-rich',
    namespace = 'react-rich',
    embedded = isEmbedded,
    hmr = true,
    hmrId,
    headless = false,
  } = options

  return defineExtension({
    ...(initialEditorState ? { $initialEditorState: initialEditorState } : {}),
    dependencies: [
      configExtension(HMRExtension, {
        hot: hmr ? (import.meta.hot ?? null) : null,
        ...(hmrId === undefined ? {} : { id: hmrId }),
      }),
      configExtension(RichTextExtension, {
        // escapeFormatTriggers: {
        //   code: {arrow: true, click: true, enter: true, onlyAtBoundary: true},
        // },
      }),
      ClipboardDOMImportExtension,
      HistoryExtension,
      // Let the documentation page keep focus when this example is embedded.
      configExtension(AutoFocusExtension, {
        disabled: embedded,
      }),
      // TreeView is a React extension and needs LexicalExtensionComposer.
      ...(headless ? [] : [TreeViewExtension]),
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
      CodePrismExtension,
      // custom
      ImageExtension,
      LinkExtension,
      DiagramExtension,
    ],
    name,
    namespace,
    theme: classTheme,
  })
}
