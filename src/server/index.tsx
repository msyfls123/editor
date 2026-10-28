import { Hono } from 'hono'
import { EditorServerDurable } from './EditorServerDurable'

import { Script, Link, ViteClient, ReactRefresh } from 'vite-ssr-components/react'
import { renderToReadableStream } from 'react-dom/server'
import { env } from 'cloudflare:workers'

const app = new Hono()

app.get('/', async (c) => {
  c.header('Content-Type', 'text/html')
  return c.body(
    await renderToReadableStream(
      <html>
        <head>
          <ViteClient />
          <ReactRefresh />
          <Script src='/src/client/app.tsx' />
          <Link href='/src/server/style.css' rel='stylesheet' />
        </head>
        <body>
          <div id='app' />
        </body>
      </html>
    )
  )
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

export default app
export { EditorServerDurable }
