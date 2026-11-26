import { authJson } from '@ebichu-cc/auth/client'

export interface DocumentSummary {
  docId: string
  title: string
  currentVersion: number
  createdAt: number
  updatedAt: number
  excerpt?: string
}

export interface DocumentResponse {
  ok: true
  document: DocumentSummary
}

export interface DocumentListResponse {
  ok: true
  documents: DocumentSummary[]
  nextBefore: number | null
}

export interface VersionSummary {
  version: number
  baseVersion: number | null
  label: string | null
  authorId: string | null
  createdAt: number
}

export interface VersionDetail extends VersionSummary {
  state: string
  plainText: string
  stateSha256: string
  clientSaveId: string | null
  resourceIds: string[]
}

export interface VersionListResponse {
  ok: true
  versions: VersionSummary[]
  nextBefore: number | null
}

export interface VersionResponse {
  ok: true
  version: VersionDetail
}

export interface SaveVersionPayload {
  state: string
  plainText: string
  clientSaveId: string
  baseVersion?: number
  resourceIds?: string[]
  label?: string | null
}

export interface SaveVersionResponse {
  ok: true
  version: number
  createdAt: number
  replayed: boolean
}

function documentPath(docId: string): string {
  return `/api/documents/${encodeURIComponent(docId)}`
}

export function listDocuments(
  params: { limit?: number; before?: number } = {},
): Promise<DocumentListResponse> {
  const search = new URLSearchParams()
  if (params.limit !== undefined) search.set('limit', String(params.limit))
  if (params.before !== undefined) search.set('before', String(params.before))
  const query = search.toString()
  return authJson<DocumentListResponse>(`/api/documents${query ? `?${query}` : ''}`)
}

export function createDocument(title: string): Promise<DocumentResponse> {
  return authJson<DocumentResponse>('/api/documents', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

export function getDocument(docId: string): Promise<DocumentResponse> {
  return authJson<DocumentResponse>(documentPath(docId))
}

export function updateDocumentTitle(
  docId: string,
  title: string,
): Promise<DocumentResponse> {
  return authJson<DocumentResponse>(documentPath(docId), {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

export function listVersions(
  docId: string,
  params: { limit?: number; before?: number } = {},
): Promise<VersionListResponse> {
  const search = new URLSearchParams()
  if (params.limit !== undefined) search.set('limit', String(params.limit))
  if (params.before !== undefined) search.set('before', String(params.before))
  const query = search.toString()
  return authJson<VersionListResponse>(
    `${documentPath(docId)}/versions${query ? `?${query}` : ''}`,
  )
}

export function getVersion(docId: string, version: number): Promise<VersionResponse> {
  return authJson<VersionResponse>(`${documentPath(docId)}/versions/${version}`)
}

export function saveVersion(
  docId: string,
  payload: SaveVersionPayload,
): Promise<SaveVersionResponse> {
  return authJson<SaveVersionResponse>(`${documentPath(docId)}/versions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function restoreVersion(
  docId: string,
  version: number,
  payload: Pick<SaveVersionPayload, 'clientSaveId' | 'baseVersion' | 'label'>,
): Promise<SaveVersionResponse> {
  return authJson<SaveVersionResponse>(
    `${documentPath(docId)}/versions/${version}/restore`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}
