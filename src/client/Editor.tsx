import { useRef, useEffect, useState, useCallback } from 'react'
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
      wsRef.current = new WebSocket(`ws://${location.host}/websocket`)
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

      <button onClick={toggleActive}>{active ? 'Disable' : 'Enable'}</button>
      <button onClick={send} disabled={!active}>Send!</button>

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
