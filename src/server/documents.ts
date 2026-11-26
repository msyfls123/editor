import type { Context } from 'hono'
import { env } from 'cloudflare:workers'

import type { AppEnv } from './auth'
import type { SaveVersionInput, SaveVersionResult } from './EditorServerDurable'
import { fail } from './respond'

const MAX_TITLE_LENGTH = 200
const MAX_LABEL_LENGTH = 120
const MAX_CLIENT_SAVE_ID_LENGTH = 200
const MAX_RESOURCE_IDS = 200
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const EXCERPT_LENGTH = 300

type AppContext = Context<AppEnv>
type JsonObject = Record<string, unknown>

interface ArticleRow {
  doc_id: string
  title: string
  author_id: string
  current_version: number
  status: string
  created_at: number
  updated_at: number
}

interface ResourceAccessRow {
  resource_id: string
  owner_id: string
  visibility: string
}

interface LoadedArticle {
  ok: true
  row: ArticleRow
  userId: string
}

type LoadResult = LoadedArticle | { ok: false; response: Response }

function toDocument(row: ArticleRow, currentVersion = row.current_version) {
  return {
    docId: row.doc_id,
    title: row.title,
    currentVersion,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function parseLimit(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE
  return Math.min(parsed, MAX_PAGE_SIZE)
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function parseBefore(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

async function readJsonObject(
  c: AppContext,
): Promise<{ ok: true; value: JsonObject } | { ok: false; response: Response }> {
  let parsed: unknown
  try {
    const text = await c.req.text()
    parsed = text.trim() ? JSON.parse(text) : {}
  } catch {
    return { ok: false, response: fail(c, 400, 'VALIDATION_ERROR', 'Invalid JSON body') }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, response: fail(c, 400, 'VALIDATION_ERROR', 'JSON body must be an object') }
  }

  return { ok: true, value: parsed as JsonObject }
}

async function loadOwnedArticle(c: AppContext, docId: string): Promise<LoadResult> {
  const user = c.get('user')
  if (!user) {
    return { ok: false, response: fail(c, 401, 'UNAUTHORIZED', 'Login required') }
  }

  const row = await env.EDITOR_DB.prepare(
    `SELECT doc_id, title, author_id, current_version, status, created_at, updated_at
     FROM articles
     WHERE doc_id = ?`,
  )
    .bind(docId)
    .first<ArticleRow>()

  if (!row || row.status !== 'active') {
    return { ok: false, response: fail(c, 404, 'NOT_FOUND', 'Document not found') }
  }

  if (row.author_id !== user.id) {
    return { ok: false, response: fail(c, 403, 'FORBIDDEN', 'Document belongs to another user') }
  }

  return { ok: true, row, userId: user.id }
}

function parseTitle(value: unknown): { ok: true; title: string } | { ok: false; message: string } {
  if (typeof value !== 'string') {
    return { ok: false, message: 'title must be a string' }
  }
  if (value.length > MAX_TITLE_LENGTH) {
    return { ok: false, message: `title must be at most ${MAX_TITLE_LENGTH} characters` }
  }
  return { ok: true, title: value }
}

function parseClientSaveId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_CLIENT_SAVE_ID_LENGTH) return null
  return trimmed
}

function parseBaseVersion(
  value: unknown,
): { ok: true; value?: number } | { ok: false; message: string } {
  if (value === undefined || value === null) return { ok: true }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return { ok: false, message: 'baseVersion must be a non-negative integer' }
  }
  return { ok: true, value }
}

function parseResourceIds(
  value: unknown,
): { ok: true; value: string[] } | { ok: false; message: string } {
  if (value === undefined || value === null) return { ok: true, value: [] }
  if (!Array.isArray(value)) {
    return { ok: false, message: 'resourceIds must be an array of strings' }
  }

  const ids: string[] = []
  for (const item of value) {
    if (typeof item !== 'string' || !item) {
      return { ok: false, message: 'resourceIds must be an array of non-empty strings' }
    }
    if (!ids.includes(item)) ids.push(item)
  }

  if (ids.length > MAX_RESOURCE_IDS) {
    return { ok: false, message: `at most ${MAX_RESOURCE_IDS} resourceIds are allowed` }
  }
  return { ok: true, value: ids }
}

function parseLabel(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (value === undefined || value === null) return { ok: true, value: null }
  if (typeof value !== 'string' || value.length > MAX_LABEL_LENGTH) {
    return {
      ok: false,
      message: `label must be a string of at most ${MAX_LABEL_LENGTH} characters`,
    }
  }
  return { ok: true, value }
}

interface SavePayload {
  state: string
  plainText: string
  clientSaveId: string
  baseVersion?: number
  resourceIds: string[]
  label: string | null
}

function parseSavePayload(
  body: JsonObject,
): { ok: true; value: SavePayload } | { ok: false; message: string } {
  if (typeof body.state !== 'string') {
    return { ok: false, message: 'state must be a string' }
  }

  const plainText = body.plainText
  if (plainText !== undefined && typeof plainText !== 'string') {
    return { ok: false, message: 'plainText must be a string' }
  }

  const clientSaveId = parseClientSaveId(body.clientSaveId)
  if (!clientSaveId) {
    return { ok: false, message: 'clientSaveId is required' }
  }

  const baseVersion = parseBaseVersion(body.baseVersion)
  if (!baseVersion.ok) return baseVersion

  const resourceIds = parseResourceIds(body.resourceIds)
  if (!resourceIds.ok) return resourceIds

  const label = parseLabel(body.label)
  if (!label.ok) return label

  return {
    ok: true,
    value: {
      state: body.state,
      plainText: plainText ?? '',
      clientSaveId,
      ...(baseVersion.value === undefined ? {} : { baseVersion: baseVersion.value }),
      resourceIds: resourceIds.value,
      label: label.value,
    },
  }
}

/**
 * Rejects references to resources the author may not use. Soft-deleted
 * resources stay valid so history and restore keep working (SPEC FR-5.8).
 */
async function assertResourcesUsable(
  c: AppContext,
  userId: string,
  resourceIds: string[],
): Promise<Response | null> {
  if (resourceIds.length === 0) return null

  // D1 caps bound parameters per query, so look up in chunks.
  const byId = new Map<string, ResourceAccessRow>()
  const chunkSize = 90

  for (let offset = 0; offset < resourceIds.length; offset += chunkSize) {
    const chunk = resourceIds.slice(offset, offset + chunkSize)
    const placeholders = chunk.map(() => '?').join(', ')
    const result = await env.EDITOR_DB.prepare(
      `SELECT resource_id, owner_id, visibility
       FROM resources
       WHERE resource_id IN (${placeholders})`,
    )
      .bind(...chunk)
      .all<ResourceAccessRow>()

    for (const row of result.results) {
      byId.set(row.resource_id, row)
    }
  }

  const denied = resourceIds.filter((resourceId) => {
    const row = byId.get(resourceId)
    if (!row) return true
    return row.owner_id !== userId && row.visibility !== 'public'
  })

  if (denied.length > 0) {
    return fail(c, 403, 'FORBIDDEN', 'Referenced resources are not accessible')
  }

  return null
}

/** Mirrors the DO commit into D1 (best effort: the DO remains the source of truth). */
async function syncArticleIndex(
  docId: string,
  version: number,
  updatedAt: number,
  resourceIds: string[],
): Promise<void> {
  const statements: D1PreparedStatement[] = [
    env.EDITOR_DB.prepare(
      `UPDATE articles SET current_version = ?, updated_at = ? WHERE doc_id = ?`,
    ).bind(version, updatedAt, docId),
  ]

  for (const resourceId of resourceIds) {
    statements.push(
      env.EDITOR_DB.prepare(
        `INSERT INTO article_resources (doc_id, resource_id, first_seen_version, last_seen_version)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(doc_id, resource_id) DO UPDATE SET
           last_seen_version = excluded.last_seen_version`,
      ).bind(docId, resourceId, version, version),
    )
  }

  await env.EDITOR_DB.batch(statements)
}

function toSaveResponse(c: AppContext, result: SaveVersionResult): Response {
  if (!result.ok) {
    if (result.code === 'CONFLICT') {
      return c.json(
        {
          ok: false as const,
          code: 'CONFLICT',
          message: 'baseVersion is stale',
          currentVersion: result.currentVersion,
        },
        409,
      )
    }
    if (result.code === 'PAYLOAD_TOO_LARGE') {
      return fail(c, 413, 'PAYLOAD_TOO_LARGE', result.message)
    }
    return fail(c, 400, 'VALIDATION_ERROR', result.message)
  }

  return c.json({
    ok: true as const,
    version: result.version,
    createdAt: result.createdAt,
    replayed: result.replayed,
  })
}

async function commitVersion(
  c: AppContext,
  docId: string,
  input: SaveVersionInput,
): Promise<Response> {
  const result = await env.EDITOR_SERVER_DURABLE.getByName(docId).saveVersion(input)

  if (result.ok && !result.replayed) {
    try {
      await syncArticleIndex(docId, result.version, result.createdAt, input.resourceIds ?? [])
    } catch (error) {
      // The version is already durable in the DO; the D1 index repairs lazily.
      console.error('Failed to sync article index after saving a version', { docId, error })
    }
  }

  return toSaveResponse(c, result)
}

export async function createDocument(c: AppContext): Promise<Response> {
  const user = c.get('user')
  if (!user) {
    return fail(c, 401, 'UNAUTHORIZED', 'Login required')
  }

  const body = await readJsonObject(c)
  if (!body.ok) return body.response

  let title = ''
  if (body.value.title !== undefined && body.value.title !== null) {
    const parsed = parseTitle(body.value.title)
    if (!parsed.ok) return fail(c, 400, 'VALIDATION_ERROR', parsed.message)
    title = parsed.title
  }

  const docId = `doc_${crypto.randomUUID()}`
  const now = Date.now()

  await env.EDITOR_DB.prepare(
    `INSERT INTO articles
       (doc_id, title, author_id, current_version, status, created_at, updated_at)
     VALUES (?, ?, ?, 0, 'active', ?, ?)`,
  )
    .bind(docId, title, user.id, now, now)
    .run()

  return c.json(
    {
      ok: true as const,
      document: { docId, title, currentVersion: 0, createdAt: now, updatedAt: now },
    },
    201,
  )
}

/** Current version plain text, truncated for list previews. */
async function loadExcerpt(docId: string): Promise<string> {
  try {
    const plainText = await env.EDITOR_SERVER_DURABLE.getByName(docId).getCurrentPlainText()
    return plainText.slice(0, EXCERPT_LENGTH)
  } catch (error) {
    console.error('Failed to load document excerpt', { docId, error })
    return ''
  }
}

export async function listDocuments(c: AppContext): Promise<Response> {
  const user = c.get('user')
  if (!user) {
    return fail(c, 401, 'UNAUTHORIZED', 'Login required')
  }

  const limit = parseLimit(c.req.query('limit'))
  const before = parseBefore(c.req.query('before'))

  const columns = `doc_id, title, author_id, current_version, status, created_at, updated_at`

  const statement = before === undefined
    ? env.EDITOR_DB.prepare(
        `SELECT ${columns}
         FROM articles
         WHERE author_id = ? AND status = 'active'
         ORDER BY updated_at DESC
         LIMIT ?`,
      ).bind(user.id, limit)
    : env.EDITOR_DB.prepare(
        `SELECT ${columns}
         FROM articles
         WHERE author_id = ? AND status = 'active' AND updated_at < ?
         ORDER BY updated_at DESC
         LIMIT ?`,
      ).bind(user.id, before, limit)

  const result = await statement.all<ArticleRow>()
  const last = result.results.at(-1)

  const documents = await Promise.all(
    result.results.map(async (row) => ({
      ...toDocument(row),
      excerpt: await loadExcerpt(row.doc_id),
    })),
  )

  return c.json({
    ok: true as const,
    documents,
    nextBefore: result.results.length === limit ? last?.updated_at ?? null : null,
  })
}

export async function getDocument(c: AppContext): Promise<Response> {
  const docId = c.req.param('docId')
  if (!docId) return fail(c, 404, 'NOT_FOUND', 'Document not found')
  const loaded = await loadOwnedArticle(c, docId)
  if (!loaded.ok) return loaded.response

  // The DO owns the version counter; D1 keeps a redundant copy for lists.
  const currentVersion = await env.EDITOR_SERVER_DURABLE.getByName(docId).getCurrentVersion()

  if (currentVersion !== loaded.row.current_version) {
    try {
      await env.EDITOR_DB.prepare(
        `UPDATE articles SET current_version = ? WHERE doc_id = ?`,
      )
        .bind(currentVersion, docId)
        .run()
    } catch (error) {
      console.error('Failed to repair articles.current_version', { docId, error })
    }
  }

  return c.json({
    ok: true as const,
    document: toDocument(loaded.row, currentVersion),
  })
}

export async function updateDocument(c: AppContext): Promise<Response> {
  const docId = c.req.param('docId')
  if (!docId) return fail(c, 404, 'NOT_FOUND', 'Document not found')
  const loaded = await loadOwnedArticle(c, docId)
  if (!loaded.ok) return loaded.response

  const body = await readJsonObject(c)
  if (!body.ok) return body.response

  const parsed = parseTitle(body.value.title)
  if (!parsed.ok) return fail(c, 400, 'VALIDATION_ERROR', parsed.message)

  const now = Date.now()

  await env.EDITOR_DB.prepare(
    `UPDATE articles SET title = ?, updated_at = ? WHERE doc_id = ?`,
  )
    .bind(parsed.title, now, docId)
    .run()

  return c.json({
    ok: true as const,
    document: toDocument({ ...loaded.row, title: parsed.title, updated_at: now }),
  })
}

export async function listDocumentVersions(c: AppContext): Promise<Response> {
  const docId = c.req.param('docId')
  if (!docId) return fail(c, 404, 'NOT_FOUND', 'Document not found')
  const loaded = await loadOwnedArticle(c, docId)
  if (!loaded.ok) return loaded.response

  const limit = parseLimit(c.req.query('limit'))
  const rawBefore = c.req.query('before')

  let before: number | undefined
  if (rawBefore !== undefined) {
    const parsed = parsePositiveInt(rawBefore)
    if (parsed === null) {
      return fail(c, 400, 'VALIDATION_ERROR', 'before must be a positive integer')
    }
    before = parsed
  }

  const result = await env.EDITOR_SERVER_DURABLE.getByName(docId).listVersions({ limit, before })

  return c.json({
    ok: true as const,
    versions: result.versions,
    nextBefore: result.nextBefore,
  })
}

export async function getDocumentVersion(c: AppContext): Promise<Response> {
  const docId = c.req.param('docId')
  if (!docId) return fail(c, 404, 'NOT_FOUND', 'Document not found')
  const loaded = await loadOwnedArticle(c, docId)
  if (!loaded.ok) return loaded.response

  const version = parsePositiveInt(c.req.param('version'))
  if (version === null) {
    return fail(c, 400, 'VALIDATION_ERROR', 'version must be a positive integer')
  }

  const detail = await env.EDITOR_SERVER_DURABLE.getByName(docId).getVersion(version)
  if (!detail) {
    return fail(c, 404, 'NOT_FOUND', 'Version not found')
  }

  return c.json({ ok: true as const, version: detail })
}

export async function saveDocumentVersion(c: AppContext): Promise<Response> {
  const docId = c.req.param('docId')
  if (!docId) return fail(c, 404, 'NOT_FOUND', 'Document not found')
  const loaded = await loadOwnedArticle(c, docId)
  if (!loaded.ok) return loaded.response

  const body = await readJsonObject(c)
  if (!body.ok) return body.response

  const parsed = parseSavePayload(body.value)
  if (!parsed.ok) return fail(c, 400, 'VALIDATION_ERROR', parsed.message)

  const payload = parsed.value

  const denied = await assertResourcesUsable(c, loaded.userId, payload.resourceIds)
  if (denied) return denied

  return commitVersion(c, docId, {
    state: payload.state,
    plainText: payload.plainText,
    clientSaveId: payload.clientSaveId,
    baseVersion: payload.baseVersion,
    resourceIds: payload.resourceIds,
    label: payload.label,
    authorId: loaded.userId,
  })
}

export async function restoreDocumentVersion(c: AppContext): Promise<Response> {
  const docId = c.req.param('docId')
  if (!docId) return fail(c, 404, 'NOT_FOUND', 'Document not found')
  const loaded = await loadOwnedArticle(c, docId)
  if (!loaded.ok) return loaded.response

  const sourceVersion = parsePositiveInt(c.req.param('version'))
  if (sourceVersion === null) {
    return fail(c, 400, 'VALIDATION_ERROR', 'version must be a positive integer')
  }

  const body = await readJsonObject(c)
  if (!body.ok) return body.response

  const clientSaveId = parseClientSaveId(body.value.clientSaveId)
  if (!clientSaveId) {
    return fail(c, 400, 'VALIDATION_ERROR', 'clientSaveId is required')
  }

  const baseVersion = parseBaseVersion(body.value.baseVersion)
  if (!baseVersion.ok) return fail(c, 400, 'VALIDATION_ERROR', baseVersion.message)

  const label = parseLabel(body.value.label)
  if (!label.ok) return fail(c, 400, 'VALIDATION_ERROR', label.message)

  const source = await env.EDITOR_SERVER_DURABLE.getByName(docId).getVersion(sourceVersion)
  if (!source) {
    return fail(c, 404, 'NOT_FOUND', 'Version not found')
  }

  // Resources are copied as-is: historical versions may reference soft-deleted
  // resources, which must not block a restore (SPEC FR-5.8).
  return commitVersion(c, docId, {
    state: source.state,
    plainText: source.plainText,
    clientSaveId,
    baseVersion: baseVersion.value,
    resourceIds: source.resourceIds,
    label: label.value,
    authorId: loaded.userId,
  })
}
