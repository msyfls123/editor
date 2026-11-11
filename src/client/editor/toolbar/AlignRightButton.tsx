import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { FORMAT_ELEMENT_COMMAND } from 'lexical';
import { AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommonButtonProps } from '@/constants/format';

export function AlignRightButton({ formatStatus }: CommonButtonProps) {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="outline"
      state={formatStatus}
      onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}>
        <AlignRight/>
    </Button>
  );
}
