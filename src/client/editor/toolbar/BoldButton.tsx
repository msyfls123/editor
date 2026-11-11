import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import { Bold } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommonButtonProps } from '@/constants/format';

export function BoldButton({ formatStatus } : CommonButtonProps) {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="outline"
      state={formatStatus}
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}>
        <Bold/>
    </Button>
  );
}
