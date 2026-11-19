import { ColumnToolbar } from "@/editor/plugins/TableToolbarPlugin/ColumnToolbar";
import { RowToolbar } from "@/editor/plugins/TableToolbarPlugin/RowToolbar";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $computeTableMap, $isTableCellNode, $isTableNode, $isTableRowNode, TableRowNode } from "@lexical/table"
import { $getNearestNodeFromDOMNode } from "lexical"
import { useCallback, useEffect, useRef, useState } from "react"


interface TableToolbarState {
  tableKey: string;
  rowKey: string;
  rowIndex: number;
  rowElement: HTMLElement;
  cellKey: string;
  cellElement: HTMLElement;
  columnHeadElement: HTMLElement;
  columnIndex: number;
}

export const TableToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext()
  const [toolbar, setToolbar] =
    useState<TableToolbarState | null>(null);

  const isToolbarHovered = useRef(false)
  const closeToolbarTimeoutRef = useRef<number | null>(null)

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    const cellElement = target.closest('td, th') as HTMLElement | null
    if (!cellElement) return

    const context = editor.read(() => {
      const cell = $getNearestNodeFromDOMNode(cellElement)
      if (!$isTableCellNode(cell)) return null
      const row = cell.getParent()
      if (!$isTableRowNode(row)) return null
      const table = row.getParent()
      if (!$isTableNode(table)) return null
      const rowIndex = table.getChildren().indexOf(row)
      const columnIndex = row.getChildren().indexOf(cell)
      const firstRow = rowIndex === 0 ? row : row.getPreviousSiblings()[0] as TableRowNode
      const columnHeadKey = firstRow.getChildAtIndex(columnIndex)?.getKey()

      return {
        tableKey: table.getKey(),
        rowKey: row.getKey(),
        cellKey: cell.getKey(),
        rowIndex,
        columnIndex,
        columnHeadKey,
      }
    })
    if (!context) return

    const rowElement = editor.getElementByKey(
      context.rowKey,
    );
    if (!rowElement) return

    const columnHeadElement = context.columnHeadKey && editor.getElementByKey(context.columnHeadKey)
    if (!columnHeadElement) return

    setToolbar(previous => {
      if (
        previous?.cellKey === context.cellKey &&
        previous.rowElement === rowElement
      ) {
        return previous;
      }

      return {
        ...context,
        rowElement,
        cellElement,
        columnHeadElement,
      };
    });

  }, [editor])

  const handleMouseLeave = useCallback(() => {
    if (closeToolbarTimeoutRef.current) {
      window.clearTimeout(closeToolbarTimeoutRef.current)
      closeToolbarTimeoutRef.current = null
    }
    closeToolbarTimeoutRef.current = window.setTimeout(() => {
      if (!isToolbarHovered.current) setToolbar(null)
      closeToolbarTimeoutRef.current = null
    }, 200)
  }, [])

  useEffect(() => {
    const rootElement = editor.getRootElement()
    rootElement?.addEventListener('mousemove', handleMouseMove)
    rootElement?.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      rootElement?.removeEventListener('mousemove', handleMouseMove)
      rootElement?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [editor, handleMouseLeave, handleMouseMove])

  return (
    <div className="table-toolbar-plugin">
      {toolbar && (
        <>
          <RowToolbar
            editor={editor}
            tableKey={toolbar.tableKey}
            reference={toolbar.cellElement}
            rowKey={toolbar.rowKey}
            rowIndex={toolbar.rowIndex}
            isToolbarHovered={isToolbarHovered}
          />
          <ColumnToolbar
            editor={editor}
            tableKey={toolbar.tableKey}
            reference={toolbar.cellElement}
            cellKey={toolbar.cellKey}
            columnIndex={toolbar.columnIndex}
            isToolbarHovered={isToolbarHovered}
          />
        </>
      )}
    </div>
  )
}
