import { ReactElement, ReactNode, SubmitEvent, useCallback, useRef } from "react"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface LinkDialogProps {
  children: ReactElement
  open: boolean
  onSubmit: (payload: { text: string, url: string }) => void
  onCancel: () => void
  text?: string
  url?: string
}

export const LinkDialog = ({ children, open, onSubmit, onCancel, text, url }: LinkDialogProps) => {
  const textEl = useRef<HTMLInputElement>(null)
  const urlEl = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback((e: SubmitEvent) => {
    e.preventDefault()
    onSubmit({
      text: textEl.current!.value,
      url: urlEl.current!.value
    })
  }, [])

  return <Dialog open={open} onOpenChange={(v) => {
    if (!v) onCancel()
  }}>
    <DialogTrigger render={children}></DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Link</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex space-x-3 items-center"><span>Text</span><Input defaultValue={text} ref={textEl} required></Input></label>
        <label className="flex space-x-3 items-center"><span>Url</span><Input defaultValue={url} ref={urlEl} required></Input></label>
        <DialogFooter>
          <Button type="submit">Submit</Button>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
