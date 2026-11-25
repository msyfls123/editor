-- 0001_init.sql
-- Article metadata and user resource library live in D1.
-- Version snapshots live in the per-document Durable Object SQLite.

CREATE TABLE IF NOT EXISTS articles (
  doc_id          TEXT PRIMARY KEY,
  title           TEXT NOT NULL DEFAULT '',
  author_id       TEXT NOT NULL,
  current_version INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_author
  ON articles (author_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS resources (
  resource_id TEXT PRIMARY KEY,
  owner_id    TEXT NOT NULL,
  object_key  TEXT NOT NULL,
  filename    TEXT NOT NULL,
  mime        TEXT NOT NULL,
  size        INTEGER NOT NULL,
  sha256      TEXT NOT NULL,
  visibility  TEXT NOT NULL DEFAULT 'private',
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  INTEGER NOT NULL,
  UNIQUE (owner_id, sha256)
);

CREATE INDEX IF NOT EXISTS idx_resources_owner
  ON resources (owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS article_resources (
  doc_id             TEXT NOT NULL,
  resource_id        TEXT NOT NULL,
  first_seen_version INTEGER NOT NULL,
  last_seen_version  INTEGER NOT NULL,
  PRIMARY KEY (doc_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_article_resources_resource
  ON article_resources (resource_id);
