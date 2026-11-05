import { describe, expect, it } from 'vitest'
import manifest from './images.generated.json'
import { DESTINATIONS } from './destinations'
import { ITINERARY_PLANS } from './itineraries'
import { ISLAND_FILTERS, ISLANDS, rankIslands } from './islands'
import { PLACES } from './routes'

const images = manifest as Record<string, { country: string; author: string; license: string; sourceUrl: string; alt: string }>

const referenced = (): Array<[string, string]> => [
  ...Object.entries(DESTINATIONS).flatMap(([country, d]) =>
    [d.heroImage, ...d.gallery, ...d.topics.map((t) => t.image)].map((id): [string, string] => [country, id]),
  ),
  ...ISLANDS.flatMap((i) => [i.image, ...i.gallery].map((id): [string, string] => [i.country, id])),
  ...Object.values(PLACES).map((p): [string, string] => [p.country, p.image]),
  ...Object.entries(ITINERARY_PLANS).flatMap(([country, days]) => days.map((d): [string, string] => [country, d.image])),
]

describe('image manifest', () => {
  it('has attribution for every photo', () => {
    for (const [id, image] of Object.entries(images)) {
      expect(image.license, id).toMatch(/CC|Public domain|PD/i)
      expect(image.author, id).not.toBe('')
      expect(image.sourceUrl, id).toMatch(/^https:\/\/commons\.wikimedia\.org/)
      expect(image.alt, id).not.toBe('')
    }
  })

  it('only references existing photos from the matching country', () => {
    for (const [country, id] of referenced()) {
      expect(images[id], id).toBeDefined()
      expect(images[id]?.country, `${id} used for ${country}`).toBe(country)
    }
  })
})

describe('islands', () => {
  it('covers the requested islands in both countries', () => {
    expect(ISLANDS.filter((i) => i.country === 'thailand').map((i) => i.id).sort()).toEqual(['angthong', 'nangyuan', 'phangan', 'samui', 'tao'])
    expect(ISLANDS.filter((i) => i.country === 'malaysia').map((i) => i.id).sort()).toEqual(['besar', 'kecil', 'langtengah', 'redang'])
  })

  it.each(ISLAND_FILTERS.map((f) => f.key))('ranks by %s', (key) => {
    const ranked = rankIslands(key)
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i - 1]!.scores[key]).toBeGreaterThanOrEqual(ranked[i]!.scores[key])
    }
  })
})
