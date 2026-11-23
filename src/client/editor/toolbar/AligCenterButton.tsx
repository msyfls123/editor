import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { FORMAT_ELEMENT_COMMAND } from 'lexical';
import { AlignCenter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommonButtonProps } from '@/editor/constants/format';

export function AlignCenterButton({ formatStatus }: CommonButtonProps) {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="outline"
      state={formatStatus}
      className="text-righ"
      onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}>
        <AlignCenter/>
    </Button>
  );
}
