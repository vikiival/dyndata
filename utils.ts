import { crypto } from 'crypto/mod.ts'
import { encodeHex } from 'jsr:@std/encoding@0.217/hex'
import {
  withQuery,
  withTrailingSlash,
} from 'ufo/index.mjs'

export function hexOf(sn: string): Promise<string> {
  const encoded = new TextEncoder().encode(sn)
  return crypto.subtle.digest('KECCAK-256', encoded)
    .then(encodeHex)
    .then((v) => `0x${v}`)
}

export function withUrlParam(url: string, key: string, value: string): string {
  const base = withTrailingSlash(url)
  return withQuery(base, { [key]: value })
}

export function contractOf(address: string): string {
  return address?.toLowerCase()
}