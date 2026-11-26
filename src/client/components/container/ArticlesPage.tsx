import { useEffect, useState } from 'react'
import { ArrowLeft, FileText, RefreshCw } from 'lucide-react'
import { AuthRequestError } from '@ebichu-cc/auth/client'

import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useAuth } from '@/components/AuthProvider'
import { goToLogin } from '@/lib/auth-login'
import { formatTime } from '@/lib/datetime'
import { listDocuments, type DocumentSummary } from '@/lib/documents'

const PAGE_SIZE = 10

export function ArticlesPage() {
  const { state } = useAuth()
  const userId = state.status === 'authenticated' ? state.user.id : null

  const [items, setItems] = useState<DocumentSummary[]>([])
  const [nextBefore, setNextBefore] = useState<number | null>(null)
  const [before, setBefore] = useState<number | undefined>(undefined)
  const [history, setHistory] = useState<Array<number | undefined>>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!userId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    listDocuments({ limit: PAGE_SIZE, before })
      .then((payload) => {
        if (cancelled) return
        setItems(payload.documents)
        setNextBefore(payload.nextBefore)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setItems([])
        setNextBefore(null)
        setError(
          cause instanceof AuthRequestError && cause.status === 401
            ? 'Your session expired. Refresh the page and sign in again.'
            : cause instanceof Error
              ? cause.message
              : 'Failed to load articles',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, before, reloadToken])

  const goNext = () => {
    if (nextBefore === null) return
    setHistory((previous) => [...previous, before])
    setBefore(nextBefore)
    setPage((current) => current + 1)
  }

  const goPrevious = () => {
    if (history.length === 0) return
    const previousBefore = history[history.length - 1]
    setHistory((previous) => previous.slice(0, -1))
    setBefore(previousBefore)
    setPage((current) => Math.max(1, current - 1))
  }

  const canPrevious = history.length > 0
  const canNext = nextBefore !== null && items.length === PAGE_SIZE

  return (
    <section className="mt-10 w-full pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My articles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sorted by last updated
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href="/" />}
          >
            <ArrowLeft />
            Back to home
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || !userId}
            onClick={() => setReloadToken((token) => token + 1)}
          >
            <RefreshCw className={loading ? 'animate-spin' : undefined} />
            Refresh
          </Button>
        </div>
      </div>

      {state.status === 'loading' && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-lg border bg-muted/40"
            />
          ))}
        </div>
      )}

      {state.status === 'anonymous' && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">Sign in to see your articles</p>
          <Button className="mt-4" variant="outline" onClick={goToLogin}>
            Sign in
          </Button>
        </div>
      )}

      {state.status === 'authenticated' && (
        <>
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!error && !loading && items.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              <FileText className="size-6" />
              No articles yet. Create one from the home page.
            </div>
          )}

          {!error && items.length > 0 && (
            <ul className="divide-y overflow-hidden rounded-lg border bg-background">
              {items.map((doc) => (
                <li key={doc.docId}>
                  <a
                    href={`/article?docId=${encodeURIComponent(doc.docId)}`}
                    className="block px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="truncate font-medium text-slate-900">
                        {doc.title || 'Untitled article'}
                      </h2>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        v{doc.currentVersion}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                      {doc.excerpt || '(Empty document)'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Created {formatTime(doc.createdAt)}</span>
                      <span>Updated {formatTime(doc.updatedAt)}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="Previous"
                  aria-disabled={!canPrevious}
                  className={canPrevious ? undefined : 'pointer-events-none opacity-50'}
                  onClick={(event) => {
                    event.preventDefault()
                    goPrevious()
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive
                  onClick={(event) => event.preventDefault()}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="Next"
                  aria-disabled={!canNext}
                  className={canNext ? undefined : 'pointer-events-none opacity-50'}
                  onClick={(event) => {
                    event.preventDefault()
                    goNext()
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}
    </section>
  )
}
