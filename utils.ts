import { crypto } from 'crypto/mod.ts'
import { encodeHex } from 'jsr:@std/encoding@0.217/hex'

export function hexOf(sn: string): Promise<string> {
  const encoded = new TextEncoder().encode(sn)
  return crypto.subtle.digest('KECCAK-256', encoded)
    .then(encodeHex)
    .then((v) => `0x${v}`)
}

export function withUrlParam(url: string, key: string, value: string): string {
  const base = new URL(url)
  base.searchParams.append(key, value)
  return base.toString()
}
