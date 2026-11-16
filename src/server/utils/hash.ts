const CHUNK_SIZE = 1 * 1024 * 1024
import { createHash } from 'node:crypto'

function pushRing(ring: Uint8Array, chunk: Uint8Array, pos: number): number {
  let offset = 0;
  while (offset < chunk.length) {
    const writeLen = Math.min(chunk.length - offset, ring.length - pos);
    const src = chunk.subarray(offset, offset + writeLen);
    ring.set(src, pos);
    pos += writeLen;
    offset += writeLen;
    if (pos >= ring.length) pos = 0;
  }
  return pos;
}

function concatUint8(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function calcEdgeHash(
  stream: ReadableStream<Uint8Array>,
  totalSize: number,
  algorithm: string = 'sha-256'
): Promise<string> {
  if (totalSize <= CHUNK_SIZE * 2) {
    const buf = await new Response(stream).arrayBuffer();
    const digest = await crypto.subtle.digest(algorithm, buf);
    return toBase64Url(new Uint8Array(digest));
  }

  const reader = stream.getReader();
  const headParts: Uint8Array[] = [];
  let headCollected = 0;

  const tailRing = new Uint8Array(CHUNK_SIZE);
  let ringPos = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = value;

    if (headCollected < CHUNK_SIZE) {
      const take = Math.min(chunk.length, CHUNK_SIZE - headCollected);
      headParts.push(chunk.subarray(0, take));
      headCollected += take;
      if (take < chunk.length) {
        ringPos = pushRing(tailRing, chunk.subarray(take), ringPos);
      }
    } else {
      ringPos = pushRing(tailRing, chunk, ringPos);
    }
  }

  const head = concatUint8(headParts);
  const tail = concatUint8([
    tailRing.subarray(ringPos),
    tailRing.subarray(0, ringPos),
  ]);
  const combined = concatUint8([head, tail]);

  const digest = await crypto.subtle.digest(algorithm, combined as unknown as BufferSource);
  return toBase64Url(new Uint8Array(digest))
}
