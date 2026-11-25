import { useCallback, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { PageLayout } from '@/components/PageLayout'
import { Button } from '@/components/ui/button'
import { Editor } from '@/editor'

function EditorPage() {
  const [active, setActive] = useState(false)
  const wsRef = useRef<WebSocket>(null)
  const [messages, setMessages] = useState<Array<{ from: string; text: string; time: number }>>([])

  const toggleActive = useCallback(() => {
    if (active) {
      wsRef.current?.close()
      wsRef.current = null
      setActive(false)
      return
    }

    const isHttps = location.protocol.startsWith('https')
    wsRef.current = new WebSocket(`${isHttps ? 'wss' : 'ws'}://${location.host}/websocket`)
    wsRef.current.addEventListener('message', (event) => {
      setMessages((previous) => [
        ...previous,
        { from: 'server', text: event.data, time: Date.now() },
      ])
    })
    setActive(true)
  }, [active])

  const send = useCallback(() => {
    const text = 'hello'
    setMessages((previous) => [
      ...previous,
      { from: 'client', text, time: Date.now() },
    ])
    wsRef.current?.send(text)
  }, [])

  return (
    <>
      <p>
        Demo WebSocket &nbsp;
        <Button onClick={toggleActive}>{active ? 'Disable' : 'Enable'}</Button>
        <Button onClick={send} disabled={!active}>Send!</Button>
      </p>

      <ul>
        {messages.map((message) => (
          <li key={message.time.toString()}>
            From: {message.from}, Text: {message.text}
          </li>
        ))}
      </ul>

      <Editor />
    </>
  )
}

const root = document.getElementById('app')
if (root) {
  createRoot(root).render(
    <PageLayout>
      <EditorPage />
    </PageLayout>,
  )
}
