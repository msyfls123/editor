import { FormatState, FormatStatus } from "@/constants/format";
import { $isDecoratorTextNode } from "@lexical/extension";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import { $getSelection, $isBlockElementNode, $isElementNode, $isParagraphNode, $isRangeSelection, $isTextNode, BaseSelection, COMMAND_PRIORITY_LOW, ElementFormatType, ElementNode, getParentElement, SELECTION_CHANGE_COMMAND, TextFormatType, TextNode, type LexicalNode } from "lexical";
import { useEffect, useState } from "react";

type TextFormatState = Omit<FormatState, 'align'>

const TEXT_FORMATS = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'highlight',
  'subscript',
  'superscript',
] as const

const DEFAULT_TEXT_FORMAT_STATE: TextFormatState = {
  bold: FormatStatus.INACTIVE,
  italic: FormatStatus.INACTIVE,
  underline: FormatStatus.INACTIVE,
  strikethrough: FormatStatus.INACTIVE,
  highlight: FormatStatus.INACTIVE,
  subscript: FormatStatus.INACTIVE,
  superscript: FormatStatus.INACTIVE,
}

function getFormatStatus(nodes: LexicalNode[], format: TextFormatType): FormatStatus {
  const textNodes = nodes.filter(node => $isTextNode(node) && node.getTextContentSize() > 0) as TextNode[]

  if (textNodes.length === 0) return FormatStatus.INACTIVE

  const formattedCount = textNodes.filter(node => node.hasFormat(format)).length

  if (formattedCount === textNodes.length) return FormatStatus.ACTIVE

  if (formattedCount === 0) return FormatStatus.INACTIVE

  return FormatStatus.MIXED
}

function readElementFormat(selection: BaseSelection | null): ElementFormatType {
  const nodes = selection?.getNodes() ?? []
  if (nodes.length == 0) return ''
  const elementFormats = nodes.map(node => {
    if ($isElementNode(node)) return node.getFormatType()
    if ($isBlockElementNode(node)) return node.getFormatType()
    if ($isDecoratorBlockNode(node)) return node.getFormat()
    return node.getParents().find($isParagraphNode)?.getFormatType()
  }).filter(Boolean) as ElementFormatType[]

  const formats = new Set(elementFormats)
  if (formats.size > 1) return ''
  return Array.from(formats)[0]
}

function readTextFormat(selection: BaseSelection | null): TextFormatState {

  if (!$isRangeSelection(selection)) return DEFAULT_TEXT_FORMAT_STATE

  if (selection.isCollapsed()) {
    return TEXT_FORMATS.reduce((acc, v) => ({
        ...acc,
        [v]: selection.hasFormat(v) ? FormatStatus.ACTIVE : FormatStatus.INACTIVE
      }), {} as TextFormatState)
  }

  const nodes = selection.getNodes()

  return TEXT_FORMATS.reduce((acc, v) => ({
    ...acc,
    [v]: getFormatStatus(nodes, v)
  }), {} as TextFormatState)
}

function readFormat() {
  const selection = $getSelection()
  const elementAlign = readElementFormat(selection)

  return {
    ...readTextFormat(selection),
    align: elementAlign
  }
}

export const useTextFormat = (): FormatState => {
  const [editor] = useLexicalComposerContext()

  const [format, setFormat] = useState<FormatState>({
    ...DEFAULT_TEXT_FORMAT_STATE,
    align: ''
  })

  useEffect(() => {
    editor.getEditorState().read(() => {
      setFormat(readFormat())
    })

    const unregisterUpdate = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        setFormat(readFormat())
      })
    })

    const unregisterSelection = editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
      setFormat(readFormat())
      return false
    }, COMMAND_PRIORITY_LOW)

    return () => {
      unregisterSelection()
      unregisterUpdate()
    }
  }, [editor])

  return format
}
