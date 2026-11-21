import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { Button } from '@/components/ui/button';
import { INSERT_DIAGRAM_COMMAND } from '@/editor/plugins/DiagramExtension';
import { GraphHub } from 'lucide-react'

export function DiagramButton() {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="outline"
      onClick={() => editor.dispatchCommand(INSERT_DIAGRAM_COMMAND)}>
        <GraphHub />
    </Button>
  );
}
