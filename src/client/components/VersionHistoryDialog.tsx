import { useCallback, useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { ReadOnlyEditor } from '@/editor/preview'
import { formatTime } from '@/lib/datetime'
import {
  getVersion,
  listVersions,
  restoreVersion,
  type VersionDetail,
  type VersionSummary,
} from '@/lib/documents'
import { describeRequestError } from '@/lib/errors'

const PAGE_SIZE = 20

interface VersionHistoryDialogProps {
  docId: string
  /** Version the editor is currently based on. */
  baseVersion: number
  /** Latest version on the server. */
  currentVersion: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestored: (version: number, state: string) => void
}

export function VersionHistoryDialog({
  docId,
  baseVersion,
  currentVersion,
  open,
  onOpenChange,
  onRestored,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<VersionSummary[]>([])
  const [nextBefore, setNextBefore] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [detail, setDetail] = useState<VersionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setVersions([])
    setNextBefore(null)
    setSelected(null)
    setDetail(null)

    listVersions(docId, { limit: PAGE_SIZE })
      .then((payload) => {
        if (cancelled) return
        setVersions(payload.versions)
        setNextBefore(payload.nextBefore)
        setSelected(payload.versions[0]?.version ?? null)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setVersions([])
        setNextBefore(null)
        setSelected(null)
        setError(describeRequestError(cause, 'Failed to load versions'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [docId, open])

  useEffect(() => {
    if (!open || selected === null) {
      setDetail(null)
      return
    }

    let cancelled = false
    setDetailLoading(true)

    getVersion(docId, selected)
      .then((payload) => {
        if (!cancelled) setDetail(payload.version)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setDetail(null)
        toast.add({
          type: 'error',
          description: describeRequestError(cause, 'Failed to load version content'),
        })
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [docId, open, selected])

  const loadMore = useCallback(async () => {
    if (nextBefore === null || loadingMore) return

    setLoadingMore(true)
    try {
      const payload = await listVersions(docId, {
        limit: PAGE_SIZE,
        before: nextBefore,
      })
      setVersions((previous) => [...previous, ...payload.versions])
      setNextBefore(payload.nextBefore)
    } catch (cause) {
      toast.add({
        type: 'error',
        description: describeRequestError(cause, 'Failed to load more versions'),
      })
    } finally {
      setLoadingMore(false)
    }
  }, [docId, nextBefore, loadingMore])

  const handleRestore = useCallback(async () => {
    if (!detail || restoring) return

    setRestoring(true)
    try {
      const result = await restoreVersion(docId, detail.version, {
        clientSaveId: crypto.randomUUID(),
        baseVersion,
      })
      toast.add({
        type: 'success',
        description: `Created v${result.version} from v${detail.version}`,
      })
      onRestored(result.version, detail.state)
      onOpenChange(false)
    } catch (cause) {
      toast.add({
        type: 'error',
        description: describeRequestError(cause, 'Failed to restore version'),
      })
    } finally {
      setRestoring(false)
    }
  }, [detail, restoring, docId, baseVersion, onRestored, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Version history</DialogTitle>
          <DialogDescription>
            Latest server version v{currentVersion}; the editor is based on v{baseVersion}. Select a version to preview and restore.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid h-[65vh] grid-cols-1 gap-4 sm:grid-cols-[12rem_1fr]">
          <div className="overflow-y-auto rounded-lg border bg-muted/20">
            {loading && (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            )}

            {!loading && versions.length === 0 && !error && (
              <p className="p-4 text-sm text-muted-foreground">No versions yet</p>
            )}

            {!loading && versions.length > 0 && (
              <ul className="divide-y">
                {versions.map((version) => {
                  const isSelected = version.version === selected
                  return (
                    <li key={version.version}>
                      <button
                        type="button"
                        onClick={() => setSelected(version.version)}
                        className={cn(
                          'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors',
                          isSelected
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-muted',
                        )}
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="font-medium">v{version.version}</span>
                          {version.version === currentVersion && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                              Latest
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(version.createdAt)}
                        </span>
                        {version.label && (
                          <span className="max-w-full truncate text-xs text-muted-foreground">
                            {version.label}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {nextBefore !== null && (
              <div className="p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={loadingMore}
                  onClick={loadMore}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border">
            {selected === null && (
              <p className="p-4 text-sm text-muted-foreground">Select a version to preview its content</p>
            )}

            {selected !== null && detailLoading && (
              <div className="h-full animate-pulse bg-muted/40" />
            )}

            {selected !== null && !detailLoading && detail && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-3 py-2">
                  <div className="text-sm">
                    <span className="font-medium">v{detail.version}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatTime(detail.createdAt)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={restoring || detail.version === currentVersion}
                    title={
                      detail.version === currentVersion
                        ? 'The current version does not need restoring'
                        : undefined
                    }
                    onClick={handleRestore}
                  >
                    <RotateCcw />
                    {restoring ? 'Restoring…' : 'Restore this version'}
                  </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  <ReadOnlyEditor key={detail.version} state={detail.state} />
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
