import { ButtonGroup } from "@/components/ui/button-group"
import { BoldButton } from "./BoldButton"
import { ItalicButton } from "./ItalicButton"
import { StrikethroughButton } from './StrikethroughButton'
import { UnderlineButton } from "./UnderlineButton"
import { AlignLeftButton } from "./AlignLeftButton"
import { AlignRightButton } from "./AlignRightButton"
import { AlignCenterButton } from './AligCenterButton'
import { Button } from "@/components/ui/button"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot } from "lexical"
import { Save, Loader2 } from "lucide-react"
import { useState, type ReactNode } from "react"
import { ImageButton } from "./Image"
import { ImportButton } from "./ImportButton"
import { useTextFormat } from "../hooks/useTextFormat"
import { FormatStatus } from "@/editor/constants/format"
import { LinkButton } from "./LinkButton"
import { TableButton } from "./TableButton"
import { DiagramButton } from "@/editor/toolbar/DiagramButton"
import { BlockTypeSelect } from "@/editor/toolbar/BlockTypeSelect"

interface ToolbarProps {
  onSave: (state: string, plainText: string) => void | Promise<void>
  children?: ReactNode
}

export const Toolbar = ({ onSave, children }: ToolbarProps) => {
  const [editor] = useLexicalComposerContext()
  const format = useTextFormat()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (saving) return

    const editorState = editor.getEditorState()
    const state = JSON.stringify(editorState)
    const plainText = editorState.read(() => $getRoot().getTextContent())

    setSaving(true)
    try {
      await onSave(state, plainText)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sticky top-0 p-2 rounded  bg-slate-300/80 z-50 w-100vw flex flex-wrap gap-3" >
      <ButtonGroup>
        <BlockTypeSelect />
      </ButtonGroup>
      <ButtonGroup>
        <BoldButton formatStatus={format.bold} />
        <ItalicButton formatStatus={format.italic} />
        <UnderlineButton formatStatus={format.underline} />
        <StrikethroughButton formatStatus={format.strikethrough} />
      </ButtonGroup>
      <ButtonGroup>
        <AlignLeftButton formatStatus={format.align === 'left' ? FormatStatus.ACTIVE : FormatStatus.INACTIVE}/>
        <AlignCenterButton formatStatus={format.align === 'center' ? FormatStatus.ACTIVE : FormatStatus.INACTIVE} />
        <AlignRightButton  formatStatus={format.align === 'right' ? FormatStatus.ACTIVE : FormatStatus.INACTIVE}/>
      </ButtonGroup>

      <ButtonGroup>
        <ImageButton />
        <LinkButton />
        <TableButton />
        <DiagramButton />
      </ButtonGroup>

      <ButtonGroup>
        <Button
          variant="outline"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
        </Button>
      </ButtonGroup>

      {children}
    </div>
  )
}
