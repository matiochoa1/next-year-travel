import { createServer } from 'node:http'
import { loadConfig } from './config'
import type { VerifyIdentity } from './identity'
import { MemoryRepository } from './memory-repository'
import { execute, routes, type Deps } from './service'
import { createTableClient } from './storage'
import { TableRepository } from './table-repository'

/**
 * Runs the real handlers without Azure Functions Core Tools. Data lives in memory unless
 * STORAGE_CONNECTION_STRING points at Azurite. Never deployed: the Functions entry is main.ts.
 */
const DEV_GROUP = 'devgroup1'
const DEV_ADMIN = 'admin@example.com'
const port = Number(process.env.PORT ?? 7071)

const config = loadConfig({
  ...process.env,
  RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT ?? 'dev',
  SESSION_SECRET: process.env.SESSION_SECRET ?? 'dev-session-secret',
  ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? DEV_ADMIN,
  COOKIE_SECURE: 'false',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173',
  GROUP_CREATION_SECRET: process.env.GROUP_CREATION_SECRET ?? 'dev-secret',
})

let repo: Deps['repo'] = new MemoryRepository()
if (process.env.STORAGE_CONNECTION_STRING) {
  const client = createTableClient(config)
  await client.createTable()
  repo = new TableRepository(client)
}

if (!(await repo.getGroup(DEV_GROUP))) {
  await repo.createGroup({
    groupId: DEV_GROUP,
    title: 'Next Stop: Asia (desarrollo)',
    createdAt: new Date().toISOString(),
    status: 'open',
    votingClosesAt: null,
  })
}

/** Stands in for Google locally: the credential is simply "dev|email|name". */
const verifyIdentity: VerifyIdentity = async (credential) => {
  const [prefix, email, name] = credential.split('|')
  return prefix === 'dev' && email ? { subject: email, email, name } : null
}

const compiled = routes.map((route) => ({
  route,
  pattern: new RegExp(`^/api/${route.path.replace(/\{(\w+)\}/g, '(?<$1>[^/]+)')}$`),
}))

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const match = compiled
    .map(({ route, pattern }) => ({ route, result: pattern.exec(url.pathname) }))
    .find(({ route, result }) => result && (req.method === route.method || req.method === 'OPTIONS'))
  if (!match?.result) {
    res.writeHead(404).end()
    return
  }
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const response = await execute(
    match.route,
    {
      method: req.method ?? 'GET',
      params: { ...match.result.groups },
      headers: new Headers(req.headers as Record<string, string>),
      json: async () => JSON.parse(Buffer.concat(chunks).toString('utf8')),
    },
    { repo, config, verifyIdentity, now: () => new Date(), log: console.error },
  )
  res.writeHead(response.status, { 'Content-Type': 'application/json', ...response.headers })
  res.end(response.status === 204 ? undefined : JSON.stringify(response.body))
}).listen(port, () => {
  console.log(`Dev API on http://localhost:${port}/api (group ${DEV_GROUP}, admin ${DEV_ADMIN})`)
})
