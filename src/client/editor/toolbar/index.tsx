import { ButtonGroup } from "@/components/ui/button-group"
import { BoldButton } from "./BoldButton"
import { ItalicButton } from "./ItalicButton"
import { StrikethroughButton } from './StrikethroughButton'
import { UnderlineButton } from "./UnderlineButton"
import { AlignLeftButton } from "./AlignLeftButton"
import { AlignRightButton } from "./AlignRightButton"
import { AlignCenterButton } from './AligCenterButton'

export const Toolbar = () => {
  return (
    <div className="flex space-x-5" >
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
    </div>
  )
}
