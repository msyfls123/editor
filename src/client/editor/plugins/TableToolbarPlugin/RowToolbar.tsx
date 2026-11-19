import { Button } from '@/components/ui/button';
import {
  FloatingPortal,
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from '@floating-ui/react';
import { $insertTableRowAtNode, $isTableCellNode, $isTableNode, $isTableRowNode, $removeTableRowAtIndex } from '@lexical/table';

import { $getNodeByKey, type LexicalEditor } from 'lexical';
import { GripHorizontal, Plus, X } from 'lucide-react';
import { RefObject, useEffect } from 'react';

interface RowToolbarProps {
  editor: LexicalEditor;
  tableKey: string;
  rowKey: string;
  reference: HTMLElement;
  rowIndex: number;
  isToolbarHovered: RefObject<boolean>
}

export function RowToolbar({
  editor,
  tableKey,
  rowKey,
  reference,
  rowIndex,
  isToolbarHovered
}: RowToolbarProps) {
  const {
    refs,
    floatingStyles,
  } = useFloating({
    placement: 'bottom',
    strategy: 'fixed',
    middleware: [
      offset(-8),
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setPositionReference(reference);
  }, [reference, refs]);

  const insertRow = () => {
    editor.update(() => {
      const row = $getNodeByKey(rowKey);

      if (!$isTableRowNode(row)) {
        return;
      }

      const cell = row.getFirstChild();

      if (!$isTableCellNode(cell)) {
        return;
      }

      $insertTableRowAtNode(cell, true);
    });
  };

  const deleteRow = () => {
    editor.update(() => {
      const row = $getNodeByKey(rowKey);

      if (!$isTableRowNode(row)) {
        return;
      }

      const table = row.getParent();

      if (!$isTableNode(table)) {
        return;
      }

      if (table.getChildrenSize() <= 1) {
        return;
      }

      $removeTableRowAtIndex(table, rowIndex);
    });
  };

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="table-row-toolbar bg-slate-50 border border-slate-150 py-0 leading-0 px-0.5 rounded-full"
        onMouseDown={event => event.preventDefault()}
        onMouseEnter={() => isToolbarHovered.current = true}
        onMouseLeave={() => isToolbarHovered.current = false}
      >
        <Button
          variant="ghost"
          title="Drag row"
          className="drag-handle size-4 rounded-full px-0"
        >
          <GripHorizontal className="size-3" />
        </Button>

        <Button
          variant="ghost"
          title="Insert row below"
          onClick={insertRow}
          className="size-4 rounded-full px-0"
        >
          <Plus className="size-3" />
        </Button>

        <Button
          variant="ghost"
          size="xs"
          title="Delete row"
          onClick={deleteRow}
          className="size-4 rounded-full px-0"
        >
          <X className="size-3" />
        </Button>
      </div>
    </FloatingPortal>
  );
}
