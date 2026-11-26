import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, FilePlus2, FileText, Loader2, LogIn, PenLine } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { useAuth } from '@/components/AuthProvider'
import { goToLogin } from '@/lib/auth-login'
import { formatTime } from '@/lib/datetime'
import { createDocument, listDocuments, type DocumentSummary } from '@/lib/documents'
import { describeRequestError } from '@/lib/errors'

function EntryCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col rounded-2xl border bg-background p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-2 text-slate-900">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  )
}

export function HomePage() {
  const { state } = useAuth()
  const authenticated = state.status === 'authenticated'

  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [recent, setRecent] = useState<DocumentSummary[] | null>(null)

  useEffect(() => {
    if (!authenticated) {
      setRecent(null)
      return
    }

    let cancelled = false
    listDocuments({ limit: 5 })
      .then((payload) => {
        if (!cancelled) setRecent(payload.documents)
      })
      .catch(() => {
        if (!cancelled) setRecent([])
      })

    return () => {
      cancelled = true
    }
  }, [authenticated])

  const handleCreate = useCallback(async () => {
    if (!authenticated) {
      goToLogin()
      return
    }
    if (creating) return

    const nextTitle = title.trim()
    if (!nextTitle) {
      toast.add({
        type: 'info',
        description: 'Please enter a title first',
      })
      return
    }

    setCreating(true)
    try {
      const payload = await createDocument(nextTitle)
      window.location.assign(
        `/article?docId=${encodeURIComponent(payload.document.docId)}`,
      )
    } catch (cause) {
      toast.add({
        type: 'error',
        description: describeRequestError(cause, 'Failed to create article'),
      })
      setCreating(false)
    }
  }, [authenticated, creating, title])

  return (
    <section className="mt-10 w-full pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">ebichu editor</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Write a quick draft, or sign in to save articles and versions to the cloud.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <EntryCard
          icon={<PenLine className="size-5 text-emerald-700" />}
          title="Temporary document"
          description="No sign-in required. Content stays in this browser; refreshing will not lose it."
        >
          <Button
            className="w-full"
            variant="outline"
            nativeButton={false}
            render={<a href="/playground" />}
          >
            <PenLine />
            Start writing
            <ArrowRight />
          </Button>
        </EntryCard>

        <EntryCard
          icon={<FilePlus2 className="size-5 text-sky-700" />}
          title="New online document"
          description="Save to the cloud with version history. Requires an ebichu account."
        >
          <div className="flex flex-col gap-2">
            <Input
              value={title}
              maxLength={200}
              placeholder="Article title"
              aria-label="Article title"
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleCreate()
              }}
            />
            <Button
              className="w-full"
              disabled={
                creating ||
                state.status === 'loading' ||
                (authenticated && title.trim().length === 0)
              }
              onClick={handleCreate}
            >
              {creating ? <Loader2 className="animate-spin" /> : <FilePlus2 />}
              {authenticated ? 'Create and start editing' : 'Sign in to create'}
            </Button>
            {state.status === 'anonymous' && (
              <p className="text-xs text-muted-foreground">
                Signed out? You can still write a temporary document. Creating an online document will take you to sign in.
              </p>
            )}
          </div>
        </EntryCard>
      </div>

      {authenticated && (
        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent articles</h2>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<a href="/articles" />}
            >
              View all
              <ArrowRight />
            </Button>
          </div>

          {recent === null && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-lg border bg-muted/40"
                />
              ))}
            </div>
          )}

          {recent !== null && recent.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              <FileText className="size-6" />
              No articles yet. Create your first one.
            </div>
          )}

          {recent !== null && recent.length > 0 && (
            <ul className="divide-y overflow-hidden rounded-lg border bg-background">
              {recent.map((doc) => (
                <li key={doc.docId}>
                  <a
                    href={`/article?docId=${encodeURIComponent(doc.docId)}`}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-slate-900">
                          {doc.title || 'Untitled article'}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          v{doc.currentVersion}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {doc.excerpt || '(Empty document)'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatTime(doc.updatedAt)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {state.status === 'anonymous' && (
        <div className="mt-8 flex items-center justify-between gap-4 rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">
            Sign in to save articles online and browse version history.
          </p>
          <Button variant="outline" onClick={goToLogin}>
            <LogIn />
            Sign in
          </Button>
        </div>
      )}
    </section>
  )
}
