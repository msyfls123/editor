import { LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_HIGH, configExtension, defineExtension } from 'lexical';
import { $createMyLinkNode, $isMyLinkNode, MyLinkNode } from './LinkNode';

export const LinkExtension = defineExtension({
  name: 'editor/link',
  nodes: () => [
    MyLinkNode,
  ],
  register(editor) {
    const unregisterToggle = editor.registerCommand(
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
    const unregisterTransform = editor.registerNodeTransform(LinkNode, node => {
      const textContent = node.getTextContent()
      const url = node.getURL()
      const myLink = $createMyLinkNode({
        text: textContent,
        url,
      })
      node.replace(myLink)
    })
    return () => {
      unregisterToggle()
      unregisterTransform()
    }
  }
})
