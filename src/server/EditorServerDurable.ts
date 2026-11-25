import { DurableObject } from 'cloudflare:workers'

import { sha256Hex } from './utils/hash'

const MAX_STATE_BYTES = 512 * 1024
const MAX_PLAIN_TEXT_BYTES = 256 * 1024
const MAX_RESOURCE_IDS = 200

const SCHEMA_V1 = [
  `CREATE TABLE IF NOT EXISTS documents (
    id              TEXT PRIMARY KEY,
    current_version INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS document_versions (
    id             TEXT PRIMARY KEY,
    document_id    TEXT NOT NULL,
    version        INTEGER NOT NULL,
    base_version   INTEGER,
    state          TEXT NOT NULL,
    plain_text     TEXT NOT NULL DEFAULT '',
    state_sha256   TEXT NOT NULL,
    label          TEXT,
    author_id      TEXT,
    client_save_id TEXT,
    created_at     INTEGER NOT NULL,
    UNIQUE (document_id, version),
    UNIQUE (document_id, client_save_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_versions_doc
    ON document_versions (document_id, version DESC)`,
  `CREATE TABLE IF NOT EXISTS version_resources (
    document_id TEXT NOT NULL,
    version     INTEGER NOT NULL,
    resource_id TEXT NOT NULL,
    PRIMARY KEY (document_id, version, resource_id)
  )`,
]

export interface SaveVersionInput {
  state: string
  plainText: string
  clientSaveId: string
  baseVersion?: number
  resourceIds?: string[]
  label?: string | null
  authorId?: string | null
}

export type SaveVersionResult =
  | { ok: true; version: number; createdAt: number; replayed: boolean }
  | { ok: false; code: 'CONFLICT'; currentVersion: number }
  | { ok: false; code: 'INVALID'; message: string }

interface DocumentRow {
  [key: string]: SqlStorageValue
  current_version: number
  created_at: number
}

interface ExistingVersionRow {
  [key: string]: SqlStorageValue
  version: number
  created_at: number
}

export class EditorServerDurable extends DurableObject<Cloudflare.Env> {
  sessions: Map<WebSocket, { [key: string]: string }>

  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env)
    this.sessions = new Map()

    this.ctx.blockConcurrencyWhile(async () => {
      this.migrate()
    })

    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = ws.deserializeAttachment()
      if (attachment) {
        this.sessions.set(ws, { ...attachment })
      }
    })

    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
  }

  private get docId() {
    return this.ctx.id.name ?? 'default'
  }

  private migrate() {
    const sql = this.ctx.storage.sql
    const row = sql.exec<{ user_version: number }>('PRAGMA user_version').toArray()[0]
    const version = row?.user_version ?? 0

    if (version >= 1) return

    for (const statement of SCHEMA_V1) {
      sql.exec(statement)
    }
    sql.exec('PRAGMA user_version = 1')
  }

  async saveVersion(input: SaveVersionInput): Promise<SaveVersionResult> {
    if (typeof input.state !== 'string' || typeof input.plainText !== 'string') {
      return { ok: false, code: 'INVALID', message: 'state and plainText must be strings' }
    }
    if (!input.clientSaveId) {
      return { ok: false, code: 'INVALID', message: 'clientSaveId is required' }
    }
    if (input.baseVersion !== undefined
      && (!Number.isInteger(input.baseVersion) || input.baseVersion < 0)) {
      return { ok: false, code: 'INVALID', message: 'baseVersion must be a non-negative integer' }
    }

    const stateBytes = new TextEncoder().encode(input.state)
    if (stateBytes.byteLength > MAX_STATE_BYTES) {
      return { ok: false, code: 'INVALID', message: 'state is too large' }
    }
    if (new TextEncoder().encode(input.plainText).byteLength > MAX_PLAIN_TEXT_BYTES) {
      return { ok: false, code: 'INVALID', message: 'plainText is too large' }
    }

    const resourceIds = Array.from(new Set(input.resourceIds ?? []))
    if (resourceIds.length > MAX_RESOURCE_IDS) {
      return { ok: false, code: 'INVALID', message: 'too many resourceIds' }
    }

    // Hashing is async, so it must happen before transactionSync.
    const stateSha256 = await sha256Hex(stateBytes)

    return this.ctx.storage.transactionSync((): SaveVersionResult => {
      const sql = this.ctx.storage.sql

      const existing = sql.exec<ExistingVersionRow>(
        `SELECT version, created_at
         FROM document_versions
         WHERE document_id = ? AND client_save_id = ?`,
        this.docId,
        input.clientSaveId,
      ).toArray()[0]

      if (existing) {
        return {
          ok: true,
          version: existing.version,
          createdAt: existing.created_at,
          replayed: true,
        }
      }

      const doc = sql.exec<DocumentRow>(
        'SELECT current_version, created_at FROM documents WHERE id = ?',
        this.docId,
      ).toArray()[0]

      const currentVersion = doc?.current_version ?? 0

      if (input.baseVersion !== undefined && input.baseVersion !== currentVersion) {
        return { ok: false, code: 'CONFLICT', currentVersion }
      }

      const nextVersion = currentVersion + 1
      const now = Date.now()

      sql.exec(
        `INSERT INTO document_versions
           (id, document_id, version, base_version, state, plain_text, state_sha256,
            label, author_id, client_save_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        crypto.randomUUID(),
        this.docId,
        nextVersion,
        input.baseVersion ?? null,
        input.state,
        input.plainText,
        stateSha256,
        input.label ?? null,
        input.authorId ?? null,
        input.clientSaveId,
        now,
      )

      for (const resourceId of resourceIds) {
        sql.exec(
          `INSERT OR IGNORE INTO version_resources (document_id, version, resource_id)
           VALUES (?, ?, ?)`,
          this.docId,
          nextVersion,
          resourceId,
        )
      }

      sql.exec(
        `INSERT INTO documents (id, current_version, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           current_version = excluded.current_version,
           updated_at = excluded.updated_at`,
        this.docId,
        nextVersion,
        doc?.created_at ?? now,
        now,
      )

      return { ok: true, version: nextVersion, createdAt: now, replayed: false }
    })
  }

  async fetch(req: Request): Promise<Response> {
    const websocketPair = new WebSocketPair()
    const [client, server] = Object.values(websocketPair)

    this.ctx.acceptWebSocket(server)

    const id = crypto.randomUUID()

    server.serializeAttachment({ id })

    this.sessions.set(server, { id })
    console.log('init', id)

    return new Response(null, {
      status: 101,
      webSocket: client
    })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const session = this.sessions.get(ws)

    ws.send(`[Durable Object] message: ${message}, from: ${session?.id}, to: the initiating client. Total connections: ${this.sessions.size}`);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    ws.close(code, reason)
    this.sessions.delete(ws)
  }
}
