import { useRef, useEffect, useState, useCallback } from 'react'
import  { Button } from '@/components/ui/button'
export const Editor = () => {

  const [active, setActive] = useState(false)
  const wsRef = useRef<WebSocket>(null)
  const [messages, setMessages] = useState <Array < { from: string, text: string, time: number }>>([])

  const toggleActive = useCallback(() => {
    if (active) {
      wsRef.current?.close()
      wsRef.current = null
      setActive(false)
    } else {
      const isHttps = location.protocol.startsWith('https')
      wsRef.current = new WebSocket(`${isHttps ? 'wss' : 'ws'}://${location.host}/websocket`)
      wsRef.current.addEventListener('message', (event) => {
        setMessages(prev => [
          ...prev,
          {from: 'server', text: event.data, time: Date.now()}
        ])
      })
      setActive(true)
    }
  }, [active])

  const send = useCallback(() => {
    const text = 'hello'
    setMessages(prev => [
      ...prev,
      { from: 'client', text, time: Date.now() }
    ])
    wsRef.current?.send(text)
  }, [])

  return (
    <div>
      THis is editor.
      Ahahaha!

      <Button onClick={toggleActive}>{active ? 'Disable' : 'Enable'}</Button>
      <Button onClick={send} disabled={!active}>Send!</Button>

      <ul>
        {messages.map(m => (
          <li key={m.time.toString()}>
            From: {m.from}, Text: {m.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
