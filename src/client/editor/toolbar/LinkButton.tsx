import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useCallback, useState } from 'react';
import { LinkDialog } from '../plugins/LinkExtension/LinkDialog';
import { $getSelection, $isRangeSelection } from 'lexical';

export function LinkButton() {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false)

  const [selectedText, setSelectedText] = useState<string | undefined>(undefined)

  const handleSubmit = useCallback(({ url, text }: { url: string, text: string }) => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
      url: url || 'https://share.google/aimode/rdIOMHkdCUSZ9lgPw',
      title: text
    })
    setOpen(false)
  }, [editor])
  return (
    <LinkDialog
      text={selectedText}
      open={open}
      onSubmit={handleSubmit}
      onCancel={() => setOpen(false)}
    >
      <Button
        variant="outline"
        onClick={() => {
          editor.read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              setSelectedText(selection.getTextContent())
            }
            setOpen(true)
          })
        }}
      >
        <Link/>
      </Button>
    </LinkDialog>
  );
}
