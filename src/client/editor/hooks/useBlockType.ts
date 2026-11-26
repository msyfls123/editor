import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelectionBlockType } from '@/editor/utils/format';
import { BlockTypeValue } from '@/editor/constants/format';

export function useBlockType() {
  const [editor] = useLexicalComposerContext();

  const [blockType, setBlockType] =
    useState<BlockTypeValue>(null);

  useEffect(() => {
    const readBlockType = (editorState = editor.getEditorState()) => {
      editorState.read(() => {
        const next = $getSelectionBlockType();

        if (next !== null) {
          setBlockType(next);
        }
      });
    };

    readBlockType();

    return editor.registerUpdateListener(({ editorState }) => {
      readBlockType(editorState);
    });
  }, [editor]);

  return blockType;
}
