export {}

/**
 * Creates a voting group and prints its id.
 *
 *   API_URL=https://<app>.azurewebsites.net GROUP_CREATION_SECRET=... \
 *     pnpm --filter @nsa/api create-group "Next Stop: Asia"
 */
const apiUrl = process.env.API_URL?.replace(/\/$/, '')
const secret = process.env.GROUP_CREATION_SECRET
const title = process.argv[2] ?? 'Next Stop: Asia'

if (!apiUrl || !secret) {
  console.error('API_URL and GROUP_CREATION_SECRET are required')
  process.exit(1)
}

const response = await fetch(`${apiUrl}/api/groups`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-NSA-Client': 'web',
    'X-Group-Creation-Secret': secret,
  },
  body: JSON.stringify({ title }),
})

if (!response.ok) {
  console.error(`Failed: ${response.status} ${await response.text()}`)
  process.exit(1)
}

const { groupId } = (await response.json()) as { groupId: string }
console.log(`Group id: ${groupId}`)
