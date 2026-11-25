import type { Context } from 'hono'
import { env } from 'cloudflare:workers'

import { getSession, isAllowedOrigin } from './auth'
import { sha256Hex } from './utils/hash'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const ANONYMOUS_PREFIX = 'anonymous/image'
const MEDIA_BASE_URL = 'https://media.ebichu.cc'

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

interface ResourceRow {
  resource_id: string
  owner_id: string
  object_key: string
  filename: string
  mime: string
  size: number
  sha256: string
  visibility: string
  status: string
  created_at: number
}

type UploadResult =
  | {
      ok: true
      file: File
      data: ArrayBuffer
      sha256: string
      extension: string
      mime: string
    }
  | { ok: false; response: Response }

function fail(
  c: Context,
  status: 400 | 401 | 403 | 404 | 413 | 415 | 500,
  code: string,
  message: string,
): Response {
  return c.json({ ok: false as const, code, message }, status)
}

async function readImageUpload(c: Context): Promise<UploadResult> {
  let body: Record<string, string | File>
  try {
    body = await c.req.parseBody()
  } catch {
    return { ok: false, response: fail(c, 400, 'VALIDATION_ERROR', 'Invalid multipart body') }
  }

  const file = body.file
  if (!(file instanceof File)) {
    return { ok: false, response: fail(c, 400, 'VALIDATION_ERROR', 'file is required') }
  }

  const mime = file.type.toLowerCase()
  const extension = IMAGE_EXTENSIONS[mime]
  if (!extension) {
    return {
      ok: false,
      response: fail(c, 415, 'VALIDATION_ERROR', 'Unsupported image type'),
    }
  }

  if (file.size <= 0) {
    return { ok: false, response: fail(c, 400, 'VALIDATION_ERROR', 'file is empty') }
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      response: fail(c, 413, 'PAYLOAD_TOO_LARGE', 'Image exceeds the 10 MiB limit'),
    }
  }

  const data = await file.arrayBuffer()
  const sha256 = await sha256Hex(data)

  return { ok: true, file, data, sha256, extension, mime }
}

function toResource(row: Pick<ResourceRow, 'resource_id' | 'object_key' | 'filename' | 'mime' | 'size' | 'visibility' | 'created_at'>) {
  return {
    resourceId: row.resource_id,
    key: row.object_key,
    filename: row.filename,
    mime: row.mime,
    size: row.size,
    visibility: row.visibility,
    url: `${MEDIA_BASE_URL}/${row.object_key}`,
    createdAt: row.created_at,
  }
}

function parseLimit(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE
  return Math.min(parsed, MAX_PAGE_SIZE)
}

function parseBefore(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export async function uploadResource(c: Context): Promise<Response> {
  if (!isAllowedOrigin(c.req.raw)) {
    return fail(c, 403, 'FORBIDDEN', 'Forbidden origin')
  }

  const session = await getSession(c)
  if (!session) {
    return fail(c, 401, 'UNAUTHORIZED', 'Login required')
  }

  const upload = await readImageUpload(c)
  if (!upload.ok) return upload.response

  const { file, data, sha256, extension, mime } = upload
  const ownerId = session.user.id
  const objectKey = `u/${ownerId}/${sha256}.${extension}`

  const existing = await env.EDITOR_DB.prepare(
    `SELECT resource_id, object_key, filename, mime, size, visibility, status, created_at
     FROM resources
     WHERE owner_id = ? AND sha256 = ?`,
  )
    .bind(ownerId, sha256)
    .first<ResourceRow>()

  if (existing) {
    const object = await env.R2_MEDIA.head(existing.object_key)
    if (!object) {
      await env.R2_MEDIA.put(existing.object_key, data, {
        httpMetadata: { contentType: mime },
      })
    }

    if (existing.status !== 'active') {
      await env.EDITOR_DB.prepare(
        `UPDATE resources SET status = 'active' WHERE resource_id = ?`,
      )
        .bind(existing.resource_id)
        .run()
    }

    return c.json({
      ok: true as const,
      resource: toResource(existing),
      deduped: true,
    })
  }

  await env.R2_MEDIA.put(objectKey, data, {
    httpMetadata: { contentType: mime },
  })

  const resourceId = `res_${crypto.randomUUID()}`
  const now = Date.now()

  await env.EDITOR_DB.prepare(
    `INSERT INTO resources
       (resource_id, owner_id, object_key, filename, mime, size, sha256,
        visibility, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'private', 'active', ?)
     ON CONFLICT(owner_id, sha256) DO UPDATE SET status = 'active'`,
  )
    .bind(resourceId, ownerId, objectKey, file.name, mime, file.size, sha256, now)
    .run()

  const row = await env.EDITOR_DB.prepare(
    `SELECT resource_id, object_key, filename, mime, size, visibility, status, created_at
     FROM resources
     WHERE owner_id = ? AND sha256 = ?`,
  )
    .bind(ownerId, sha256)
    .first<ResourceRow>()

  if (!row) {
    return fail(c, 500, 'INTERNAL', 'Failed to create resource')
  }

  return c.json({
    ok: true as const,
    resource: toResource(row),
    deduped: false,
  })
}

export async function listResources(c: Context): Promise<Response> {
  const session = await getSession(c)
  if (!session) {
    return fail(c, 401, 'UNAUTHORIZED', 'Login required')
  }

  const limit = parseLimit(c.req.query('limit'))
  const before = parseBefore(c.req.query('before'))

  const statement = before === undefined
    ? env.EDITOR_DB.prepare(
        `SELECT resource_id, owner_id, object_key, filename, mime, size, sha256,
                visibility, status, created_at
         FROM resources
         WHERE owner_id = ? AND status = 'active'
         ORDER BY created_at DESC
         LIMIT ?`,
      ).bind(session.user.id, limit)
    : env.EDITOR_DB.prepare(
        `SELECT resource_id, owner_id, object_key, filename, mime, size, sha256,
                visibility, status, created_at
         FROM resources
         WHERE owner_id = ? AND status = 'active' AND created_at < ?
         ORDER BY created_at DESC
         LIMIT ?`,
      ).bind(session.user.id, before, limit)

  const result = await statement.all<ResourceRow>()
  const last = result.results.at(-1)

  return c.json({
    ok: true as const,
    resources: result.results.map(toResource),
    nextBefore: result.results.length === limit ? last?.created_at ?? null : null,
  })
}

export async function deleteResource(c: Context): Promise<Response> {
  if (!isAllowedOrigin(c.req.raw)) {
    return fail(c, 403, 'FORBIDDEN', 'Forbidden origin')
  }

  const session = await getSession(c)
  if (!session) {
    return fail(c, 401, 'UNAUTHORIZED', 'Login required')
  }

  const resourceId = c.req.param('resourceId')
  if (!resourceId) {
    return fail(c, 404, 'NOT_FOUND', 'Resource not found')
  }

  const row = await env.EDITOR_DB.prepare(
    `SELECT resource_id, owner_id FROM resources WHERE resource_id = ?`,
  )
    .bind(resourceId)
    .first<Pick<ResourceRow, 'resource_id' | 'owner_id'>>()

  if (!row) {
    return fail(c, 404, 'NOT_FOUND', 'Resource not found')
  }

  if (row.owner_id !== session.user.id) {
    return fail(c, 403, 'FORBIDDEN', 'Resource belongs to another user')
  }

  await env.EDITOR_DB.prepare(
    `UPDATE resources SET status = 'deleted' WHERE resource_id = ?`,
  )
    .bind(resourceId)
    .run()

  return c.json({ ok: true as const })
}

/** Legacy upload for anonymous users. Files live under `anonymous/image/`. */
export async function uploadAnonymousImage(c: Context): Promise<Response> {
  const upload = await readImageUpload(c)
  if (!upload.ok) return upload.response

  const key = `${ANONYMOUS_PREFIX}/${upload.sha256}.${upload.extension}`

  await env.R2_MEDIA.put(key, upload.data, {
    httpMetadata: { contentType: upload.mime },
  })

  return c.json({
    ok: true as const,
    key,
    url: `https://media.ebichu.cc/${key}`,
  })
}
