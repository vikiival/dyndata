import { crypto } from 'crypto/mod.ts'
import { encodeHex } from 'jsr:@std/encoding@0.217/hex'
import {
  withLeadingSlash,
  withQuery,
} from 'ufo/index.mjs'

export function hexOf(sn: string): Promise<string> {
  const encoded = new TextEncoder().encode(sn)
  return crypto.subtle.digest('KECCAK-256', encoded)
    .then(encodeHex)
    .then((v) => `0x${v}`)
}

export function withUrlParam(url: string, key: string, value: string): string {
  const base = withLeadingSlash(url)
  return withQuery(base, { [key]: value })
}
