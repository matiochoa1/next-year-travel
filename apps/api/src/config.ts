import { normalizeEmail } from '@nsa/shared'

export interface Config {
  tableName: string
  allowedOrigins: string[]
  cookieSecure: boolean
  cookieSameSite: 'Lax' | 'None' | 'Strict'
  rateLimitSalt: string
  groupCreationSecret: string | null
  sessionSecret: string
  sessionMaxAgeSeconds: number
  googleClientId: string
  /** Normalised addresses with admin rights. They never need an invitation. */
  adminEmails: string[]
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const sameSite = env.COOKIE_SAMESITE ?? 'Lax'
  if (sameSite !== 'Lax' && sameSite !== 'None' && sameSite !== 'Strict') {
    throw new Error('COOKIE_SAMESITE must be Lax, Strict or None')
  }
  const rateLimitSalt = env.RATE_LIMIT_SALT
  if (!rateLimitSalt) throw new Error('RATE_LIMIT_SALT is required')
  const sessionSecret = env.SESSION_SECRET
  if (!sessionSecret) throw new Error('SESSION_SECRET is required')
  return {
    tableName: env.TABLE_NAME ?? 'nextstopasia',
    allowedOrigins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
    cookieSecure: env.COOKIE_SECURE !== 'false',
    cookieSameSite: sameSite,
    rateLimitSalt,
    groupCreationSecret: env.GROUP_CREATION_SECRET || null,
    sessionSecret,
    sessionMaxAgeSeconds: 60 * 60 * 24 * 60,
    googleClientId: env.GOOGLE_CLIENT_ID ?? '',
    adminEmails: (env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim()).filter(Boolean).map(normalizeEmail),
  }
}
