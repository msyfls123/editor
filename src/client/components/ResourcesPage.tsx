import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { AuthRequestError, authJson } from '@ebichu-cc/auth/client'

import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useAuth } from './AuthProvider'
import { goToLogin } from '@/lib/auth-login'

const PAGE_SIZE = 10

interface ResourceItem {
  resourceId: string
  key: string
  filename: string
  mime: string
  size: number
  visibility: string
  url: string
  createdAt: number
}

interface ListResponse {
  ok: true
  resources: ResourceItem[]
  nextBefore: number | null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

function resourceHref(resource: ResourceItem): string {
  if (location.protocol === 'https:') return resource.url
  return `/media?key=${encodeURIComponent(resource.key)}`
}

export function ResourcesPage() {
  const { state } = useAuth()
  const userId = state.status === 'authenticated' ? state.user.id : null

  const [items, setItems] = useState<ResourceItem[]>([])
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

    const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
    if (before !== undefined) params.set('before', String(before))

    authJson<ListResponse>(`/api/resources?${params.toString()}`)
      .then((payload) => {
        if (cancelled) return
        setItems(payload.resources)
        setNextBefore(payload.nextBefore)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setItems([])
        setNextBefore(null)
        setError(
          cause instanceof AuthRequestError && cause.status === 401
            ? '登录已失效，请刷新页面重新登录'
            : cause instanceof Error
              ? cause.message
              : '加载资源失败',
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
    <section className="mx-auto mt-10 w-full max-w-3xl pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">资源库</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            当前账号上传的图片资源
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
            返回编辑器
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || !userId}
            onClick={() => setReloadToken((token) => token + 1)}
          >
            <RefreshCw className={loading ? 'animate-spin' : undefined} />
            刷新
          </Button>
        </div>
      </div>

      {state.status === 'loading' && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-lg border bg-muted/40"
            />
          ))}
        </div>
      )}

      {state.status === 'anonymous' && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">登录后可以查看资源库</p>
          <Button className="mt-4" variant="outline" onClick={goToLogin}>
            去登录
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
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              还没有上传资源
            </div>
          )}

          {!error && items.length > 0 && (
            <ul className="divide-y overflow-hidden rounded-lg border bg-background">
              {items.map((resource) => (
                <li
                  key={resource.resourceId}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="truncate text-xs font-medium text-slate-900">
                        {resource.resourceId}
                      </code>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                        {resource.visibility}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatTime(resource.createdAt)}</span>
                      <span>{formatBytes(resource.size)}</span>
                      <span className="max-w-64 truncate">{resource.filename}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <a
                        href={resourceHref(resource)}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  >
                    <ExternalLink />
                    访问
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="上一页"
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
                  text="下一页"
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
