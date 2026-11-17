import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_HIGH, configExtension, defineExtension } from 'lexical';
import { $createMyLinkNode, MyLinkNode } from './LinkNode';

export const LinkExtension = defineExtension({
  name: 'editor/link',
  nodes: () => [MyLinkNode],
  register(editor) {
    return editor.registerCommand(
      TOGGLE_LINK_COMMAND,
      (payload) => {
        if (!payload) return false;

        const url = typeof payload === 'string' ? payload : payload.url;
        if (!url) return false;


        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const selectedText = selection.getTextContent() || url;
            const title = typeof payload === 'string' ? selectedText : payload.title
            console.log(title, selectedText)
            const reactLinkNode = $createMyLinkNode({ url, text: title ?? selectedText });

            selection.insertNodes([reactLinkNode]);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }
})
