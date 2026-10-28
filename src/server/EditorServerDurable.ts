import { DurableObject } from 'cloudflare:workers'

export class EditorServerDurable extends DurableObject<Env> {
  sessions: Map<WebSocket, { [key: string]: string }>

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sessions = new Map()

    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = ws.deserializeAttachment()
      if (attachment) {
        this.sessions.set(ws, { ...attachment })
      }
    })

    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
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
