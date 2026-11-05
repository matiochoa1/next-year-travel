import type { ApiErrorCode } from '@nsa/shared'

export interface ApiRequest {
  method: string
  params: Record<string, string>
  headers: { get(name: string): string | null }
  /** Parsed lazily so an invalid body only fails routes that actually read it. */
  json(): Promise<unknown>
}

export interface ApiResponse {
  status: number
  body?: unknown
  headers: Record<string, string>
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
  ) {
    super(code)
  }
}

export function parseCookies(header: string | null): Map<string, string> {
  const cookies = new Map<string, string>()
  for (const part of header?.split(';') ?? []) {
    const index = part.indexOf('=')
    if (index > 0) cookies.set(part.slice(0, index).trim(), part.slice(index + 1).trim())
  }
  return cookies
}

export function clientIp(headers: ApiRequest['headers']): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  // Azure appends the port ("1.2.3.4:5678"); IPv6 addresses contain more than one colon.
  if (forwarded && forwarded.split(':').length === 2) return forwarded.split(':')[0] as string
  return forwarded || 'unknown'
}
