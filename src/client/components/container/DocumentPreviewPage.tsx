import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, FileText, LogIn } from 'lucide-react'
import { $generateHtmlFromNodes } from '@lexical/html'
import { buildEditorFromExtensions } from '@lexical/extension'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/AuthProvider'
import { createEditorExtension } from '@/editor/extension'
import { hydrateDiagrams } from '@/editor/plugins/DiagramExtension/hydration'
import { goToLogin } from '@/lib/auth-login'
import { formatTime } from '@/lib/datetime'
import {
  getDocument,
  getVersion,
  type DocumentSummary,
} from '@/lib/documents'
import { describeRequestError } from '@/lib/errors'

/** Renders a stored EditorState to static HTML through the same extensions. */
function renderEditorStateToHtml(state: string): string {
  const editor = buildEditorFromExtensions(
    createEditorExtension(state, {
      name: 'editor/document-preview',
      namespace: 'document-preview',
      hmr: false,
      embedded: true,
      headless: true,
    }),
  )

  try {
    return editor.read(() => $generateHtmlFromNodes(editor))
  } finally {
    editor.dispose()
  }
}

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <section className="mt-16 w-full">
      <div className="rounded-xl border border-dashed bg-background p-10 text-center">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        {children && <div className="mt-5 flex justify-center gap-2">{children}</div>}
      </div>
    </section>
  )
}

function PreviewSkeleton() {
  return (
    <section className="mt-10 w-full space-y-4">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="h-64 w-full animate-pulse rounded bg-muted" />
    </section>
  )
}

export function DocumentPreviewPage({ docId }: { docId: string | null }) {
  const { state: authState } = useAuth()

  const [document, setDocument] = useState<DocumentSummary | null>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!docId || authState.status !== 'authenticated') return

    let cancelled = false
    setLoading(true)
    setError(null)
    setDocument(null)
    setHtml(null)

    void (async () => {
      const payload = await getDocument(docId)
      if (cancelled) return

      const doc = payload.document
      setDocument(doc)

      if (doc.currentVersion === 0) {
        setHtml('')
        return
      }

      const versionPayload = await getVersion(docId, doc.currentVersion)
      if (cancelled) return

      setHtml(renderEditorStateToHtml(versionPayload.version.state))
    })()
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(describeRequestError(cause, 'Failed to load the document preview'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [docId, authState.status])

  // Static HTML is in place after React commits it; hydrate media and diagrams.
  useEffect(() => {
    const container = containerRef.current
    if (!container || html === null) return

    if (location.protocol !== 'https:') {
      container
        .querySelectorAll<HTMLElement>('[data-lexical-image-block]')
        .forEach((block) => {
          const key = block.getAttribute('data-lexical-image-key')
          const img = block.querySelector('img')
          if (key && img) img.src = `/media?key=${encodeURIComponent(key)}`
        })
    }

    void hydrateDiagrams(container)
  }, [html])

  if (!docId) {
    return (
      <Panel title="Missing docId" description="Open a document from the article list.">
        <Button variant="outline" nativeButton={false} render={<a href="/articles" />}>
          <ArrowLeft />
          Articles
        </Button>
      </Panel>
    )
  }

  if (authState.status === 'loading') {
    return <PreviewSkeleton />
  }

  if (authState.status === 'anonymous') {
    return (
      <Panel title="Sign in to preview documents" description="Document previews are only available to their author.">
        <Button variant="outline" nativeButton={false} render={<a href="/" />}>
          Back to home
        </Button>
        <Button onClick={goToLogin}>
          <LogIn />
          Sign in
        </Button>
      </Panel>
    )
  }

  if (loading || (!document && !error)) {
    return <PreviewSkeleton />
  }

  if (error || !document || html === null) {
    return (
      <Panel title="Unable to load preview" description={error ?? 'The document does not exist or you do not have access.'}>
        <Button variant="outline" nativeButton={false} render={<a href="/articles" />}>
          <ArrowLeft />
          Articles
        </Button>
      </Panel>
    )
  }

  return (
    <section className="mt-8 w-full pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <a href={`/article?docId=${encodeURIComponent(document.docId)}`} />
          }
        >
          <ArrowLeft />
          Back to editor
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="size-4" />
          <span>v{document.currentVersion}</span>
          <span>·</span>
          <span>Created {formatTime(document.createdAt)}</span>
          <span>·</span>
          <span>Updated {formatTime(document.updatedAt)}</span>
        </div>
      </div>

      <h1 className="mt-6 text-3xl font-semibold text-slate-900">
        {document.title || 'Untitled article'}
      </h1>

      {html ? (
        <article
          ref={containerRef}
          className="mt-8 text-slate-900 leading-7"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">This document is empty.</p>
      )}
    </section>
  )
}
