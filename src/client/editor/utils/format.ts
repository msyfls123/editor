import {
  $getSelection,
  $isRangeSelection,
  $isNodeSelection,
  LexicalNode,
} from 'lexical';

import {
  $isHeadingNode,
  $isQuoteNode,
} from '@lexical/rich-text';

import { $isListNode } from '@lexical/list';
import { $isCodeNode } from '@lexical/code';
import { BlockType, BlockTypeValue } from '@/editor/constants/format';

export function $getSelectionBlockType(): BlockTypeValue {
  const selection = $getSelection();

  if (
    !$isRangeSelection(selection) &&
    !$isNodeSelection(selection)
  ) {
    return null;
  }

  const nodes = selection.getNodes();

  if (nodes.length === 0) {
    return null;
  }

  const blocks = new Map<string, BlockType>();

  for (const node of nodes) {
    const block = node.getTopLevelElement();

    if (!block) {
      continue;
    }

    const type = $getBlockType(block);

    if (type === null) {
      continue;
    }

    blocks.set(block.getKey(), type);
  }

  const types = new Set(blocks.values());

  if (types.size > 1) {
    return 'mixed';
  }

  return types.values().next().value ?? null;
}

function $getBlockType(
  block: LexicalNode,
): BlockType | null {
  if ($isHeadingNode(block)) {
    const tag = block.getTag();

    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      return tag;
    }

    return null;
  }

  if ($isListNode(block)) {
    return block.getListType() === 'bullet' ? 'ul' : 'ol';
  }

  if ($isQuoteNode(block)) {
    return 'blockquote';
  }

  if ($isCodeNode(block)) {
    return 'code';
  }

  if (block.getType() === 'paragraph') {
    return 'paragraph';
  }

  return null;
}
