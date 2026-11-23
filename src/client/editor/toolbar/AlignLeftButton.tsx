import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { FORMAT_ELEMENT_COMMAND } from 'lexical';
import { AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommonButtonProps } from '@/editor/constants/format';

export function AlignLeftButton({ formatStatus }: CommonButtonProps) {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="outline"
      state={formatStatus}
      className="not-last:border-r border-slate-300"
      onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}>
        <AlignLeft/>
    </Button>
  );
}
