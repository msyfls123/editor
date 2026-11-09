import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import {
  $createParagraphNode,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
} from 'lexical';

import { $isImageNode } from './ImageNode';

export function ImageNodePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Backspace / Delete
    const removeImage = () => {
      const selection = $getSelection();

      if (!$isNodeSelection(selection)) {
        return false;
      }

      const nodes = selection.getNodes();

      if (nodes.length === 0 || !nodes.every($isImageNode)) {
        return false;
      }

      nodes.forEach(node => node.remove());

      return true;
    };

    // Enter
    const insertParagraph = () => {
      const selection = $getSelection();

      if (!$isNodeSelection(selection)) {
        return false;
      }

      const nodes = selection.getNodes();

      if (nodes.length !== 1 || !$isImageNode(nodes[0])) {
        return false;
      }

      const paragraph = $createParagraphNode();

      nodes[0].insertAfter(paragraph);
      paragraph.select();

      return true;
    };

    const unregister = [
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        removeImage,
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        removeImage,
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        insertParagraph,
        COMMAND_PRIORITY_EDITOR,
      ),
    ];

    return () => unregister.forEach(fn => fn());
  }, [editor]);

  return null;
}
