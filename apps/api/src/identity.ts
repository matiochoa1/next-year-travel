import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

export interface Identity {
  subject: string
  email: string
  name?: string
}

/** Returns null for anything that is not a valid, verified identity. */
export type VerifyIdentity = (credential: string) => Promise<Identity | null>

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com']
const GOOGLE_KEYS = new URL('https://www.googleapis.com/oauth2/v3/certs')

export function createGoogleVerifier(clientId: string, keys: JWTVerifyGetKey = createRemoteJWKSet(GOOGLE_KEYS)): VerifyIdentity {
  return async (credential) => {
    if (!clientId) return null
    try {
      const { payload } = await jwtVerify(credential, keys, { issuer: GOOGLE_ISSUERS, audience: clientId })
      // An unverified address could be claimed by someone who does not own it.
      if (!payload.sub || typeof payload.email !== 'string' || payload.email_verified !== true) return null
      return {
        subject: payload.sub,
        email: payload.email,
        name: typeof payload.name === 'string' ? payload.name : undefined,
      }
    } catch {
      return null
    }
  }
}
