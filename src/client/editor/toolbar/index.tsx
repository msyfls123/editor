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
import { Save } from "lucide-react"
import { toast } from "@/components/ui/toast"
import { ImageButton } from "./Image"
import { ImportButton } from "./ImportButton"
import { useTextFormat } from "../hooks/useTextFormat"
import { FormatStatus } from "@/editor/constants/format"
import { LinkButton } from "./LinkButton"
import { TableButton } from "./TableButton"
import { DiagramButton } from "@/editor/toolbar/DiagramButton"
import { BlockTypeSelect } from "@/editor/toolbar/BlockTypeSelect"

interface ToolbarProps {
onSave: (text: string) => void
}

export const Toolbar = ({ onSave }: ToolbarProps) => {
  const [editor] = useLexicalComposerContext()
  const format = useTextFormat()

  return (
    <div className="sticky top-0 p-2 -mx-2 bg-slate-300/80 z-50 w-100vw flex flex-wrap gap-3" >
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
        <ImportButton />
        <LinkButton />
        <TableButton />
        <DiagramButton />
      </ButtonGroup>

      <ButtonGroup>
        <Button
          variant="outline"
          onClick={() => {
            onSave(JSON.stringify(editor.getEditorState()))
            toast.add({
              type: 'success',
              description: 'Saved.'
            })
          }}
        >
          <Save />
        </Button>
      </ButtonGroup>
    </div>
  )
}
