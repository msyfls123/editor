import {
  $createLineBreakNode,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  ElementNode,
} from 'lexical';

import { $setBlocksType,
} from '@lexical/selection'

import {
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text';

import {
  $createParagraphNode,
} from 'lexical';

import {
  $createCodeHighlightNode,
  $createCodeNode,
} from '@lexical/code';

import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from '@lexical/list';
import { BlockType } from '@/editor/constants/format';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback } from 'react';

export function useSetBlockType() {
  const [editor] = useLexicalComposerContext();

  const cb = useCallback((type: BlockType) => {
    switch (type) {
      case 'ul':
        editor.dispatchCommand(
          INSERT_UNORDERED_LIST_COMMAND,
          undefined,
        );
        editor.focus();
        return;

      case 'ol':
        editor.dispatchCommand(
          INSERT_ORDERED_LIST_COMMAND,
          undefined,
        );
        editor.focus();
        return;
    }

    editor.update(() => {
      const selection = $getSelection();

      if (!selection) return;

      switch (type) {
        case 'paragraph':
          $setBlocksType(
            selection,
            () => $createParagraphNode(),
          );
          break;

        case 'h1':
        case 'h2':
        case 'h3':
          $setBlocksType(
            selection,
            () => $createHeadingNode(type),
          );
          break;

        case 'blockquote':
          $setBlocksType(
            selection,
            () => $createQuoteNode(),
          );
          break;

        case 'code':
          $setSelectionAsCodeBlock(selection);
          break;
      }
    });
    editor.focus();
  }, [editor]);
  return cb
}

const CODE_BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'list',
  'quote',
  'code',
]);

function $setSelectionAsCodeBlock(
  selection: ReturnType<typeof $getSelection>,
): void {
  if (!selection || (!$isRangeSelection(selection) && !$isNodeSelection(selection))) {
    return;
  }

  const blocks = new Map<string, ElementNode>();

  for (const node of selection.getNodes()) {
    const block = node.getTopLevelElement();
    if (!$isElementNode(block) || !CODE_BLOCK_TYPES.has(block.getType())) {
      continue;
    }
    blocks.set(block.getKey(), block);
  }

  const selectedBlocks = Array.from(blocks.values());
  if (selectedBlocks.length === 0) {
    return;
  }

  const text = selectedBlocks
    .map((block) => block.getTextContent())
    .join('\n');

  const codeNode = $createCodeNode();
  text.split('\n').forEach((line, index) => {
    if (index > 0) {
      codeNode.append($createLineBreakNode());
    }
    if (line.length > 0) {
      codeNode.append($createCodeHighlightNode(line));
    }
  });

  selectedBlocks[0].insertBefore(codeNode);
  for (const block of selectedBlocks) {
    block.remove();
  }
  codeNode.selectStart();
}
