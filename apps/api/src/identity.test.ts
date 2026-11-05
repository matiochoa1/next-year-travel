import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose'
import { beforeAll, describe, expect, it } from 'vitest'
import { createGoogleVerifier, type VerifyIdentity } from './identity'

const CLIENT_ID = 'client.apps.googleusercontent.com'
const CLAIMS = { sub: '123', email: 'ana@gmail.com', email_verified: true, name: 'Ana' }

let verify: VerifyIdentity
let privateKey: CryptoKey
let foreignKey: CryptoKey

const token = async (
  claims: JWTPayload = CLAIMS,
  { key = privateKey, audience = CLIENT_ID, issuer = 'https://accounts.google.com', expires = '1h' } = {},
) =>
  new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key)

beforeAll(async () => {
  const pair = await generateKeyPair('RS256')
  privateKey = pair.privateKey
  foreignKey = (await generateKeyPair('RS256')).privateKey
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'test', alg: 'RS256', use: 'sig' }
  verify = createGoogleVerifier(CLIENT_ID, createLocalJWKSet({ keys: [jwk] }))
})

describe('Google credential verification', () => {
  it('accepts a valid token', async () => {
    expect(await verify(await token())).toEqual({ subject: '123', email: 'ana@gmail.com', name: 'Ana' })
  })

  it('rejects a token signed by someone else', async () => {
    expect(await verify(await token(CLAIMS, { key: foreignKey }))).toBeNull()
  })

  it('rejects a token issued for another app', async () => {
    expect(await verify(await token(CLAIMS, { audience: 'other-app' }))).toBeNull()
  })

  it('rejects another issuer', async () => {
    expect(await verify(await token(CLAIMS, { issuer: 'https://evil.example' }))).toBeNull()
  })

  it('rejects expired tokens', async () => {
    expect(await verify(await token(CLAIMS, { expires: '-1m' }))).toBeNull()
  })

  it('rejects unverified email addresses', async () => {
    expect(await verify(await token({ ...CLAIMS, email_verified: false }))).toBeNull()
  })

  it('rejects garbage', async () => {
    expect(await verify('not-a-token')).toBeNull()
  })

  it('refuses everything when no client id is configured', async () => {
    const unconfigured = createGoogleVerifier('', createLocalJWKSet({ keys: [] }))
    expect(await unconfigured(await token())).toBeNull()
  })
})
