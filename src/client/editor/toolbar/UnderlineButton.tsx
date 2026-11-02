import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import { Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UnderlineButton() {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="outline"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}>
        <Underline/>
    </Button>
  );
}
