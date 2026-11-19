import { Button } from "@/components/ui/button";
import {
  FloatingPortal,
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from "@floating-ui/react";
import {
  $deleteTableColumnAtSelection,
  $insertTableColumnAtNode,
  $isTableCellNode,
} from "@lexical/table";

import { $getNodeByKey, type LexicalEditor } from "lexical";
import { GripVertical, Plus, X } from "lucide-react";
import { RefObject, useEffect } from "react";

interface ColumnToolbarProps {
  editor: LexicalEditor;
  tableKey: string;
  cellKey: string;
  columnIndex: number;
  reference: HTMLElement;
  isToolbarHovered: RefObject<boolean>
}

export function ColumnToolbar({
  editor,
  cellKey,
  columnIndex,
  reference,
  isToolbarHovered,
}: ColumnToolbarProps) {
  const { refs, floatingStyles } = useFloating({
    placement: "right",
    strategy: "fixed",
    middleware: [offset(-10), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setPositionReference(reference);
  }, [reference, refs]);

  const insertColumn = () => {
    editor.update(() => {
      const cell = $getNodeByKey(cellKey);

      if (!$isTableCellNode(cell)) {
        return;
      }

      $insertTableColumnAtNode(cell, true);
    });
  };

  const deleteColumn = () => {
    editor.update(() => {
      const cell = $getNodeByKey(cellKey);

      if (!$isTableCellNode(cell)) {
        return;
      }

      cell.selectStart();

      $deleteTableColumnAtSelection();
    });
  };

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="table-column-toolbar bg-slate-50 border border-slate-150 p-0 w-4 rounded-full"
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => isToolbarHovered.current = true}
        onMouseLeave={() => isToolbarHovered.current = false}
      >
        <Button
          variant="ghost"
          title="Drag column"
          className="drag-handle block size-4 rounded-full px-0"
        >
          <GripVertical className="size-3" />
        </Button>

        <Button
          variant="ghost"
          title="Insert column right"
          onClick={insertColumn}
          className="block size-4 rounded-full px-0"
        >
          <Plus className="size-3" />
        </Button>

        <Button
          variant="ghost"
          size="xs"
          title="Delete column"
          onClick={deleteColumn}
          className="block size-4 rounded-full px-0"
        >
          <X className="size-3" />
        </Button>
      </div>
    </FloatingPortal>
  );
}
