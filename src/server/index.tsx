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
          <meta charSet="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Editor | ebichu</title>
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

app.get('/media', async (c) => {
  const key = c.req.query('key')
  if (!key) {
    return c.notFound()
  }
  const data = await env.R2_MEDIA.get(key)
  if (!data?.body) {
    return c.notFound()
  }
  return c.body(data.body, 200)
})

app.put('/image', async (c) => {
  const body = await c.req.parseBody()
  const { key, file } = body
  await env.R2_MEDIA.put(key as string, file)
  return c.json({
    ok: true,
    url: `https://media.ebichu.cc/${key}`
  })
})

export default app
export { EditorServerDurable }
