import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import { Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommonButtonProps } from '@/constants/format';

export function UnderlineButton({ formatStatus }: CommonButtonProps) {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="outline"
      state={formatStatus}
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}>
        <Underline/>
    </Button>
  );
}
