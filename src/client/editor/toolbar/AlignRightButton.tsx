import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { FORMAT_ELEMENT_COMMAND } from 'lexical';
import { AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AlignRightButton() {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="outline"
      onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}>
        <AlignRight/>
    </Button>
  );
}
