import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ReactElement, useCallback, useRef, SubmitEvent } from "react"

export interface TableSubmitPayload {
  row: number
  column: number
  firstRowIsHeader: boolean
  firstColumnIsHeader: boolean
}

interface TableCreateDialogProps {
  onSubmit: (payload: TableSubmitPayload) => void
  onCancel: () => void
  children: ReactElement
  open: boolean
}

export const TableCreateDialog = ({ onCancel, onSubmit, children, open }: TableCreateDialogProps) => {
  const rowEl = useRef<HTMLInputElement>(null)
  const columnEl = useRef<HTMLInputElement>(null)
  const firstRowIsHeaderEl = useRef<HTMLInputElement>(null)
  const firstColumnIsHeaderEl = useRef<HTMLInputElement>(null)
  const handleSubmit = useCallback((e: SubmitEvent) => {
    e.preventDefault()
    console.log(firstRowIsHeaderEl.current)
    onSubmit({
      row: Number(rowEl.current!.value),
      column: Number(columnEl.current!.value),
      firstRowIsHeader: firstRowIsHeaderEl.current!.checked,
      firstColumnIsHeader: firstColumnIsHeaderEl.current!.checked
    })
  }, [])

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) onCancel()
    }}>
      <DialogTrigger render={children}></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Table</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex space-x-3 items-center"><span>Row</span><Input type="number" defaultValue={5} ref={rowEl} required></Input></label>
          <label className="flex space-x-3 items-center"><span>Col</span><Input type="number" defaultValue={5} ref={columnEl} required></Input></label>
          <div className="grid grid-cols-2">
            <label className="flex space-x-3 items-center">
              <Checkbox inputRef={firstRowIsHeaderEl} />
              <span>First row is header</span>
            </label>
            <label className="flex space-x-3 items-center">
              <Checkbox inputRef={firstColumnIsHeaderEl} />
              <span>First column is header</span>
            </label>
          </div>
          <DialogFooter>
            <Button type="submit">Submit</Button>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
