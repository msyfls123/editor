import { Hono } from 'hono'
import type { Context } from 'hono'
import type { ReactNode } from 'react'
import { EditorServerDurable } from './EditorServerDurable'
import {
  clearSessionCookies,
  getAuth,
  getSession,
  isAllowedOrigin,
  readSessionToken,
} from './auth'
import {
  deleteResource,
  listResources,
  uploadAnonymousImage,
  uploadResource,
} from './resources'

import { Script, Link, ViteClient, ReactRefresh } from 'vite-ssr-components/react'
import { renderToReadableStream } from 'react-dom/server'
import { env } from 'cloudflare:workers'

const app = new Hono()

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

function EditorScript() {
  return <Script src='/src/client/pages/editor.tsx' />
}

function ResourcesScript() {
  return <Script src='/src/client/pages/resources.tsx' />
}

const renderEditorApp = (c: Context) =>
  renderApp(c, 'Editor', <EditorScript />)

const renderResourcesApp = (c: Context) =>
  renderApp(c, 'Resources', <ResourcesScript />)

app.get('/', renderEditorApp)
app.get('/resources', renderResourcesApp)

app.get('/api/me', async (c) => {
  c.header('Cache-Control', 'no-store')

  const verified = await getSession(c)

  if (!verified) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({
    user: verified.user,
    session: { expiresAt: verified.session.expiresAt },
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

app.post('/api/resources', uploadResource)
app.get('/api/resources', listResources)
app.delete('/api/resources/:resourceId', deleteResource)

export default app
export { EditorServerDurable }
