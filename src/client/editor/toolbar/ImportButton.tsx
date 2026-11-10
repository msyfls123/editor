import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { $insertNodes } from 'lexical';
import { Import } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallback, useMemo } from 'react';
import { getExtensionDependencyFromEditor } from '@lexical/extension';
import { DOMImportExtension } from '@lexical/html';

export function ImportButton() {
  const [editor] = useLexicalComposerContext();
  const dep = useMemo(() => getExtensionDependencyFromEditor(editor, DOMImportExtension), [editor])

  const exampleImport = useCallback(() => {
    editor.update(() => {
      const dom = new DOMParser().parseFromString(
        `<div data-lexical-image-block="true" style="text-align: right;">
          <img src="https://picsum.photos/192/192" class="inline-block">
        </div>`,
        'text/html'
      )
      const nodes = dep.output.$generateNodesFromDOM(dom)
      $insertNodes(nodes)
    })
  }, [])

  return (
    <Button
      variant="outline"
      onClick={exampleImport}>
        <Import/>
    </Button>
  );
}
