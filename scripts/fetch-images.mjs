#!/usr/bin/env node
// Downloads the curated Wikimedia Commons photos, generates responsive WebP files
// and writes the attribution manifest consumed by the web app.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'apps/web/public/images')
const manifestPath = path.join(root, 'apps/web/src/data/images.generated.json')
const UA = 'NextStopAsia/1.0 (https://github.com/matiochoa1/next-year-travel)'
const WIDTHS = [640, 960, 1440, 1920]

const stripHtml = (value = '') =>
  value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchRetry(url, attempts = 6) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': UA } })
    if (response.ok) return response
    if (attempt >= attempts) throw new Error(`${response.status} for ${url}`)
    await sleep(2000 * attempt)
  }
}

async function commonsInfo(file) {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  const params = {
    action: 'query', format: 'json', prop: 'imageinfo', titles: `File:${file}`,
    iiprop: 'url|size|extmetadata', iiurlwidth: '1920',
  }
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const json = await (await fetchRetry(url)).json()
  const page = Object.values(json.query.pages)[0]
  const info = page.imageinfo?.[0]
  if (!info) throw new Error(`Not found on Commons: ${file}`)
  return info
}

const sources = JSON.parse(await readFile(path.join(root, 'scripts/image-sources.json'), 'utf8'))
await mkdir(outDir, { recursive: true })
const previous = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : {}
const only = process.argv[2]
const manifest = {}

for (const [id, country, place, alt, file] of sources) {
  const cached = previous[id]
  if (cached?.file === file && existsSync(path.join(outDir, `${id}-640.webp`))) {
    manifest[id] = { ...cached, country, place, alt }
    continue
  }
  if (only && only !== id) continue
  const info = await commonsInfo(file)
  const meta = info.extmetadata ?? {}
  const original = Buffer.from(await (await fetchRetry(info.thumburl ?? info.url)).arrayBuffer())
  const image = sharp(original).rotate()
  const { width, height } = await image.metadata()
  const widths = WIDTHS.filter((w) => w <= width)
  for (const w of widths) {
    await sharp(original).rotate().resize({ width: w }).webp({ quality: w > 1000 ? 58 : 64, effort: 6 })
      .toFile(path.join(outDir, `${id}-${w}.webp`))
  }
  const { dominant } = await sharp(original).stats()
  manifest[id] = {
    id, country, place, alt, file,
    width, height, widths,
    color: `rgb(${dominant.r} ${dominant.g} ${dominant.b})`,
    author: stripHtml(meta.Artist?.value) || 'Autor desconocido',
    license: stripHtml(meta.LicenseShortName?.value),
    licenseUrl: meta.LicenseUrl?.value ?? null,
    sourceUrl: info.descriptionurl,
  }
  console.log('ok', id, manifest[id].license)
  await sleep(700)
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`)
console.log(`${Object.keys(manifest).length} images in manifest`)
