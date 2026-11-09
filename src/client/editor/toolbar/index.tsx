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
import { Image2Button } from "./Image2"

interface ToolbarProps {
onSave: (text: string) => void
}

export const Toolbar = ({ onSave }: ToolbarProps) => {
  const [editor] = useLexicalComposerContext()

  return (
    <div className="w-full flex flex-wrap gap-3" >
      <ButtonGroup>
        <BoldButton />
        <ItalicButton />
        <UnderlineButton />
        <StrikethroughButton />
      </ButtonGroup>
      <ButtonGroup>
        <AlignLeftButton />
        <AlignCenterButton />
        <AlignRightButton />
      </ButtonGroup>

      <ButtonGroup>
        <ImageButton />
        <Image2Button />
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
