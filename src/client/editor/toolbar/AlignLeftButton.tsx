import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { FORMAT_ELEMENT_COMMAND } from 'lexical';
import { AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AlignLeftButton() {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="outline"
      onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}>
        <AlignLeft/>
    </Button>
  );
}
