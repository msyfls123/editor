import { Editor } from '@/editor'

export function PlaygroundPage() {
  return (
    <section className="w-full">
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Temporary document</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Content is stored only in this browser and does not create versions.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Saved to localStorage `editor:draft:v1`
        </p>
      </div>

      <Editor />
    </section>
  )
}
