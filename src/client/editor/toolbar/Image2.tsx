import { ImagePlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_IMAGE_COMMAND } from "../plugins/ImageExtension";

export function Image2Button() {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="outline"
      className="relative"
      onClick={() => editor.dispatchCommand(INSERT_IMAGE_COMMAND, null)}
    >
      <ImagePlay />
    </Button>
  )
}
