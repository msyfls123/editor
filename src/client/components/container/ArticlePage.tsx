import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, FileText, History } from 'lucide-react'
import { AuthRequestError } from '@ebichu-cc/auth/client'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { useAuth } from '@/components/AuthProvider'
import { VersionHistoryDialog } from '@/components/VersionHistoryDialog'
import { EditorInner } from '@/editor/editor'
import { goToLogin } from '@/lib/auth-login'
import { formatTime } from '@/lib/datetime'
import {
  getDocument,
  getVersion,
  saveVersion,
  updateDocumentTitle,
  type DocumentSummary,
} from '@/lib/documents'
import { describeRequestError } from '@/lib/errors'

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

function EditorSkeleton() {
  return (
    <section className="mt-10 w-full space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-10 w-full animate-pulse rounded bg-muted" />
      <div className="h-64 w-full animate-pulse rounded bg-muted" />
    </section>
  )
}

interface ArticlePageProps {
  docId: string | null
}

export function ArticlePage({ docId }: ArticlePageProps) {
  const { state: authState } = useAuth()

  const [document, setDocument] = useState<DocumentSummary | null>(null)
  const [initialState, setInitialState] = useState<string | null | undefined>(undefined)
  const [titleDraft, setTitleDraft] = useState('')
  const [baseVersion, setBaseVersion] = useState(0)
  const [currentVersion, setCurrentVersion] = useState(0)
  const [editorKey, setEditorKey] = useState(0)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conflict, setConflict] = useState<{ currentVersion: number } | null>(null)
  const [loadingLatest, setLoadingLatest] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!docId || authState.status !== 'authenticated') return

    let cancelled = false
    setLoading(true)
    setError(null)
    setDocument(null)
    setInitialState(undefined)

    void (async () => {
      const payload = await getDocument(docId)
      if (cancelled) return

      const doc = payload.document
      setDocument(doc)
      setTitleDraft(doc.title)
      setBaseVersion(doc.currentVersion)
      setCurrentVersion(doc.currentVersion)

      if (doc.currentVersion > 0) {
        const versionPayload = await getVersion(docId, doc.currentVersion)
        if (!cancelled) setInitialState(versionPayload.version.state)
      } else {
        setInitialState(null)
      }
    })()
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(describeRequestError(cause, 'Failed to load article'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [docId, authState.status])

  const handleSave = useCallback(
    async (state: string, plainText: string) => {
      if (!docId) return

      try {
        const result = await saveVersion(docId, {
          state,
          plainText,
          baseVersion,
          clientSaveId: crypto.randomUUID(),
        })

        setBaseVersion(result.version)
        setCurrentVersion(result.version)
        setDocument((previous) =>
          previous
            ? {
                ...previous,
                currentVersion: result.version,
                updatedAt: result.createdAt,
              }
            : previous,
        )
        toast.add({
          type: 'success',
          description: result.replayed
            ? `Saved (replayed v${result.version})`
            : `Saved as v${result.version}`,
        })
      } catch (cause: unknown) {
        if (cause instanceof AuthRequestError && cause.code === 'CONFLICT') {
          const payload = cause.payload as { currentVersion?: unknown } | null
          const latest =
            payload && typeof payload.currentVersion === 'number'
              ? payload.currentVersion
              : baseVersion
          setConflict({ currentVersion: latest })
          return
        }

        toast.add({
          type: 'error',
          description: describeRequestError(cause, 'Failed to save'),
        })
      }
    },
    [docId, baseVersion],
  )

  const handleTitleBlur = useCallback(async () => {
    if (!docId || !document) return
    const nextTitle = titleDraft.trim()
    if (nextTitle === document.title) return

    try {
      const payload = await updateDocumentTitle(docId, nextTitle)
      setDocument(payload.document)
      setTitleDraft(payload.document.title)
      toast.add({ type: 'success', description: 'Title updated' })
    } catch (cause) {
      setTitleDraft(document.title)
      toast.add({
        type: 'error',
        description: describeRequestError(cause, 'Failed to update title'),
      })
    }
  }, [docId, document, titleDraft])

  const handleRestored = useCallback((version: number, state: string) => {
    setBaseVersion(version)
    setCurrentVersion(version)
    setDocument((previous) =>
      previous
        ? { ...previous, currentVersion: version, updatedAt: Date.now() }
        : previous,
    )
    setInitialState(state)
    setEditorKey((key) => key + 1)
  }, [])

  const handleDiscardAndLoadLatest = useCallback(async () => {
    if (!docId || !conflict) return

    const latest = conflict.currentVersion
    setLoadingLatest(true)
    try {
      if (latest > 0) {
        const payload = await getVersion(docId, latest)
        setInitialState(payload.version.state)
      } else {
        setInitialState(null)
      }
      setBaseVersion(latest)
      setCurrentVersion(latest)
      setEditorKey((key) => key + 1)
      setDocument((previous) =>
        previous ? { ...previous, currentVersion: latest } : previous,
      )
      setConflict(null)
      toast.add({ type: 'info', description: `Loaded latest version v${latest}` })
    } catch (cause) {
      toast.add({
        type: 'error',
        description: describeRequestError(cause, 'Failed to load the latest version'),
      })
    } finally {
      setLoadingLatest(false)
    }
  }, [docId, conflict])

  if (!docId) {
    return (
      <Panel title="Missing docId" description="Open an article from the home page or the article list.">
        <Button variant="outline" nativeButton={false} render={<a href="/articles" />}>
          <ArrowLeft />
          Articles
        </Button>
      </Panel>
    )
  }

  if (authState.status === 'loading') {
    return <EditorSkeleton />
  }

  if (authState.status === 'anonymous') {
    return (
      <Panel title="Sign in to edit online documents" description="Online documents require an account to save versions.">
        <Button variant="outline" nativeButton={false} render={<a href="/" />}>
          Back to home
        </Button>
        <Button onClick={goToLogin}>Sign in</Button>
      </Panel>
    )
  }

  if (loading || initialState === undefined) {
    return <EditorSkeleton />
  }

  if (error || !document) {
    return (
      <Panel title="Unable to open article" description={error ?? 'The article does not exist or you do not have access.'}>
        <Button variant="outline" nativeButton={false} render={<a href="/articles" />}>
          <ArrowLeft />
          Articles
        </Button>
        <Button variant="outline" nativeButton={false} render={<a href="/" />}>
          Back to home
        </Button>
      </Panel>
    )
  }

  return (
    <>
      <section className="mt-8 w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href="/articles" />}
          >
            <ArrowLeft />
            Articles
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-4" />
            <span>Created {formatTime(document.createdAt)}</span>
            <span>·</span>
            <span>Updated {formatTime(document.updatedAt)}</span>
          </div>
        </div>

        <div className="mt-4 border-b border-transparent transition-colors focus-within:border-slate-900">
          <Input
            value={titleDraft}
            maxLength={200}
            placeholder="Untitled article"
            aria-label="Article title"
            className="h-auto rounded-none border-0 bg-transparent px-0 py-1 text-2xl font-semibold text-slate-900 shadow-none focus-visible:ring-0 md:text-2xl"
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
        </div>
      </section>

      <EditorInner
        key={editorKey}
        hmrId={`article:${docId}:${editorKey}`}
        initialEditorState={initialState}
        onSave={handleSave}
        toolbarExtra={
          <ButtonGroup>
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              <History />
              v{currentVersion}
            </Button>
          </ButtonGroup>
        }
      />

      <VersionHistoryDialog
        docId={docId}
        baseVersion={baseVersion}
        currentVersion={currentVersion}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onRestored={handleRestored}
      />

      <Dialog
        open={conflict !== null}
        onOpenChange={(open) => {
          if (!open) setConflict(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save conflict</DialogTitle>
            <DialogDescription>
              The server has a newer version v{conflict?.currentVersion}. You can view the latest version, or continue editing on top of it and save again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConflict(null)
                setHistoryOpen(true)
              }}
            >
              <History />
              View latest version
            </Button>
            <Button
              variant="outline"
              disabled={loadingLatest}
              onClick={handleDiscardAndLoadLatest}
            >
              Load latest (discard local)
            </Button>
            <Button
              onClick={() => {
                if (conflict) setBaseVersion(conflict.currentVersion)
                setConflict(null)
                toast.add({
                  type: 'info',
                  description: 'Now based on the latest version. Save again when ready.',
                })
              }}
            >
              Continue from latest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
