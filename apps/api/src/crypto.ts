import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto'

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function newGroupId(length = 12): string {
  let id = ''
  for (let i = 0; i < length; i += 1) id += ID_ALPHABET[randomInt(ID_ALPHABET.length)]
  return id
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(Buffer.from(hashToken(a)), Buffer.from(hashToken(b)))
}

/** Google's subject id is stable for life, unlike the email; hashing avoids storing it in clear. */
export const participantIdFor = (subject: string) => hashToken(`google:${subject}`).slice(0, 32)

const sign = (payload: string, secret: string) =>
  createHmac('sha256', secret).update(payload).digest('base64url')

/**
 * Sessions are signed rather than stored so one account can be open on several devices. Revocation
 * still works because every request re-reads the participant row.
 */
export function createSession(groupId: string, participantId: string, expiresAt: number, secret: string) {
  return `${participantId}.${expiresAt}.${sign(`${groupId}.${participantId}.${expiresAt}`, secret)}`
}

export function readSession(value: string | undefined, groupId: string, now: Date, secret: string) {
  const [participantId, expires, signature] = value?.split('.') ?? []
  if (!participantId || !expires || !signature) return null
  if (!safeEqual(signature, sign(`${groupId}.${participantId}.${expires}`, secret))) return null
  return Number(expires) > now.getTime() ? participantId : null
}

/** Keeps raw IP addresses out of storage. */
export const anonymizeIp = (ip: string, salt: string) =>
  createHmac('sha256', salt).update(ip).digest('hex').slice(0, 32)
