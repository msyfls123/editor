import { Hono } from 'hono'
import type { Context } from 'hono'
import type { ReactNode } from 'react'
import { EditorServerDurable } from './EditorServerDurable'
import {
  attachSession,
  clearSessionCookies,
  getAuth,
  isAllowedOrigin,
  readSessionToken,
  requireOrigin,
  requireSession,
} from './auth'
import type { AppEnv } from './auth'
import {
  createDocument,
  getDocument,
  getDocumentVersion,
  listDocuments,
  listDocumentVersions,
  restoreDocumentVersion,
  saveDocumentVersion,
  updateDocument,
} from './documents'
import {
  deleteResource,
  listResources,
  uploadAnonymousImage,
  uploadResource,
} from './resources'

import { Script, Link, ViteClient, ReactRefresh } from 'vite-ssr-components/react'
import { renderToReadableStream } from 'react-dom/server'
import { env } from 'cloudflare:workers'

const app = new Hono<AppEnv>()

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

function contentTypeForKey(key: string): string {
  const extension = key.split('.').pop()?.toLowerCase() ?? ''
  return IMAGE_CONTENT_TYPES[extension] ?? 'application/octet-stream'
}

async function renderApp(c: Context, title: string, script: ReactNode) {
  c.header('Content-Type', 'text/html')
  const suffix = c.req.url.startsWith('http:') ? '( local )' : ''
  return c.body(
    await renderToReadableStream(
      <html>
        <head>
          <meta charSet="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>{`${title} ${suffix} | ebichu`}</title>
          <ViteClient />
          <ReactRefresh />
          {script}
          <Link href='/src/server/style.css' rel='stylesheet' />
        </head>
        <body>
          <div id='app' />
        </body>
      </html>
    )
  )
}

function HomeScript() {
  return <Script src='/src/client/pages/home.tsx' />
}

function ArticlesScript() {
  return <Script src='/src/client/pages/articles.tsx' />
}

function ArticleScript() {
  return <Script src='/src/client/pages/article.tsx' />
}

function PlaygroundScript() {
  return <Script src='/src/client/pages/playground.tsx' />
}

function ResourcesScript() {
  return <Script src='/src/client/pages/resources.tsx' />
}

const renderHomeApp = (c: Context) =>
  renderApp(c, 'Home', <HomeScript />)

const renderArticlesApp = (c: Context) =>
  renderApp(c, 'Articles', <ArticlesScript />)

const renderArticleApp = (c: Context) =>
  renderApp(c, 'Article', <ArticleScript />)

const renderPlaygroundApp = (c: Context) =>
  renderApp(c, 'Playground', <PlaygroundScript />)

const renderResourcesApp = (c: Context) =>
  renderApp(c, 'Resources', <ResourcesScript />)

app.get('/', renderHomeApp)
app.get('/articles', renderArticlesApp)
app.get('/article', renderArticleApp)
app.get('/playground', renderPlaygroundApp)
app.get('/resources', renderResourcesApp)

app.get('/api/me', attachSession, (c) => {
  c.header('Cache-Control', 'no-store')

  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({
    user,
    session: { expiresAt: session.expiresAt },
  })
})

app.post('/api/logout', async (c) => {
  if (!isAllowedOrigin(c.req.raw)) {
    return c.json({ error: 'Forbidden origin' }, 403)
  }

  const token = readSessionToken(c)
  if (token) {
    await getAuth().logout(token)
  }

  clearSessionCookies(c)
  c.header('Cache-Control', 'no-store')
  return c.json({ success: true })
})

app.get('/websocket', (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Worker expected Upgrade: websocket', {
      status: 426,
    });
  }
  const article = c.req.query('article')

  const stub = env.EDITOR_SERVER_DURABLE.getByName(article ?? 'default')

  const req = new Request(c.req.url)
  req.headers.set('Upgrade', 'websocket')

  return stub.fetch(req)
})

app.get('/media', async (c) => {
  const key = c.req.query('key')
  if (!key) {
    return c.notFound()
  }
  const data = await env.R2_MEDIA.get(key)
  if (!data?.body) {
    return c.notFound()
  }
  return c.body(data.body, 200, {
    'Content-Type': data.httpMetadata?.contentType ?? contentTypeForKey(key),
    'Cache-Control': 'public, max-age=31536000, immutable',
  })
})

app.put('/image', uploadAnonymousImage)

app.post('/api/documents', requireOrigin, requireSession, createDocument)
app.get('/api/documents', requireSession, listDocuments)
app.get('/api/documents/:docId', requireSession, getDocument)
app.patch('/api/documents/:docId', requireOrigin, requireSession, updateDocument)
app.get('/api/documents/:docId/versions', requireSession, listDocumentVersions)
app.get(
  '/api/documents/:docId/versions/:version',
  requireSession,
  getDocumentVersion,
)
app.post('/api/documents/:docId/versions', requireOrigin, requireSession, saveDocumentVersion)
app.post(
  '/api/documents/:docId/versions/:version/restore',
  requireOrigin,
  requireSession,
  restoreDocumentVersion,
)

app.post('/api/resources', uploadResource)
app.get('/api/resources', listResources)
app.delete('/api/resources/:resourceId', deleteResource)

app.onError((error, c) => {
  console.error(error)
  if (c.req.path.startsWith('/api/')) {
    return c.json({ ok: false, code: 'INTERNAL', message: 'Internal Server Error' }, 500)
  }
  return c.text('Internal Server Error', 500)
})

export default app
export { EditorServerDurable }
