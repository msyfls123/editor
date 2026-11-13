import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { ImageDown } from 'lucide-react';
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
        `<div data-lexical-image-block="true" data-lexical-image-key="editor/10年了2.png" data-lexical-image-url="https://media.ebichu.cc/editor/10年了2.png">
          <img src="https://media.ebichu.cc/editor/10年了2.png" class="inline-block" width="339px" height="106px">
        </div>`,
        'text/html'
      )
      const nodes = dep.output.$generateNodesFromDOM(dom)
      $insertNodeToNearestRoot(nodes[0])
    })
  }, [])

  return (
    <Button
      variant="outline"
      title='Import Image HTML'
      onClick={exampleImport}>
        <ImageDown/>
    </Button>
  );
}
