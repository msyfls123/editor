import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallback, useState } from 'react';
import { $createTableCellNode, $createTableNode, $createTableRowNode, $isTableCellNode, $isTableRowNode, $setTableColumnIsHeader, $setTableRowIsHeader, TableCellHeaderStates, TableCellNode, TableRowNode } from '@lexical/table';
import { $getSelection, $isRangeSelection } from 'lexical';
import { TableCreateDialog, TableSubmitPayload } from '@/editor/plugins/TableToolbarPlugin/TableCreateDialog';

export function TableButton() {
  const [showDialog, setShowDialog] = useState(false)
  const [editor] = useLexicalComposerContext();

  const handleSubmit = useCallback(({
    row, column,
    firstColumnIsHeader, firstRowIsHeader
  }: TableSubmitPayload) => {
    console.log('firstColumnIsHeader', firstColumnIsHeader, 'firstRowIsHeader', firstRowIsHeader)
    editor.update(() => {
      const tableNode = $createTableNode()
      const rows = Array.from({ length: row }).map((_, rowIndex) => {
        return Array.from({ length: column }).reduce((rowNode: TableRowNode, _, columnIndex) => {
          let status = TableCellHeaderStates.NO_STATUS
          if (firstRowIsHeader) {
            if (rowIndex === 0) {
              status = TableCellHeaderStates.ROW
            }
          }
          if (firstColumnIsHeader) {
            if (columnIndex === 0) {
              if (status == TableCellHeaderStates.ROW) {
                status = TableCellHeaderStates.BOTH
              } else {
                status = TableCellHeaderStates.COLUMN
              }
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
        if (firstColumnIsHeader) $setTableColumnIsHeader(tableNode, 0, true)
        if (firstRowIsHeader) $setTableRowIsHeader(tableNode, 0, true)
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
