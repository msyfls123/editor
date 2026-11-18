import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $convertFromMarkdownString } from '@lexical/mdast';

export function TableButton() {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="outline"
      onClick={() => {
        editor.update(() => {
          $convertFromMarkdownString(`
# 123
|head|body|
|---|---|
|smart|strong|
          `)
        })
      }}>
        <Table/>
    </Button>
  );
}
