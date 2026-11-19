import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $convertFromMarkdownString } from '@lexical/mdast';
import { useCallback, useState } from 'react';
import { $createTableCellNode, $createTableNode, $createTableRowNode, $isTableCellNode, $isTableRowNode, TableCellHeaderStates, TableCellNode, TableRowNode } from '@lexical/table';
import { $getSelection, $isRangeSelection } from 'lexical';
import { TableCreateDialog } from '@/editor/plugins/TableToolbarPlugin/TableCreateDialog';

export function TableButton() {
  const [showDialog, setShowDialog] = useState(false)
  const [editor] = useLexicalComposerContext();

  const handleSubmit = useCallback(({ row, column }: { row: number, column: number }) => {
    editor.update(() => {
      const tableNode = $createTableNode()
      const rows = Array.from({ length: row }).map((_, rowIndex) => {
        return Array.from({ length: column }).reduce((rowNode: TableRowNode, _, columnIndex) => {
          let status = TableCellHeaderStates.NO_STATUS
          if (rowIndex === 0) {
            if (columnIndex === 0) {
              status = TableCellHeaderStates.BOTH
            } else {
              status = TableCellHeaderStates.COLUMN
            }
          } else {
            if (columnIndex === 0) {
              status = TableCellHeaderStates.ROW
            }
          }
          const columnNode = $createTableCellNode(status)
          rowNode.append(columnNode)
          return rowNode
        }, $createTableRowNode())
      })
      tableNode.append(...rows)
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.insertNodes([tableNode])
        const firstRow = tableNode.getFirstChild();

        if ($isTableRowNode(firstRow)) {
          const firstCell = firstRow.getFirstChild();

          if ($isTableCellNode(firstCell)) {
            firstCell.selectStart();
          }
        }
      }
      setShowDialog(false)
    })
  }, [editor])

  return (
    <TableCreateDialog
      onSubmit={handleSubmit}
      onCancel={() => setShowDialog(false)}
      open={showDialog}
    >
      <Button
        variant="outline"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShowDialog(true)}
      >
        <Table/>
      </Button>
    </TableCreateDialog>
  );
}
