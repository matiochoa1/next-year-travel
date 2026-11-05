import { build } from 'esbuild'
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'

// Workspace packages are bundled in, so the deployed zip needs no node_modules at all.
await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile: 'dist/main.cjs',
  external: ['@azure/functions-core'],
  minify: true,
  sourcemap: 'linked',
  logLevel: 'info',
})

await rm('deploy', { recursive: true, force: true })
await mkdir('deploy', { recursive: true })
await cp('dist', 'deploy/dist', { recursive: true })
await cp('host.json', 'deploy/host.json')
await writeFile(
  'deploy/package.json',
  `${JSON.stringify({ name: 'next-stop-asia-api', version: '0.1.0', private: true, main: 'dist/main.cjs' }, null, 2)}\n`,
)
