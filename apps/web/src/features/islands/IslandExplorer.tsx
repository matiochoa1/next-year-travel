import { AnimatePresence, m } from 'motion/react'
import { useMemo, useState } from 'react'
import { Dots } from '../../components/ui/Dots'
import { Photo } from '../../components/ui/Photo'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { ISLAND_FILTERS, ISLANDS, rankIslands, SCORE_LABELS, type Island, type IslandScoreKey } from '../../data/islands'
import { COUNTRY_NAMES } from '../../data/types'

const SCORE_KEYS = Object.keys(SCORE_LABELS) as IslandScoreKey[]

const findIsland = (id: string) => ISLANDS.find((island) => island.id === id) as Island

function IslandCompare() {
  const [leftId, setLeft] = useState('tao')
  const [rightId, setRight] = useState('kecil')
  const pair = [findIsland(leftId), findIsland(rightId)] as const

  const picker = (value: string, onChange: (id: string) => void, label: string) => (
    <label className="block min-w-0 text-sm">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full border border-ivory/30 bg-ocean-900 px-2 font-semibold text-ivory"
      >
        {ISLANDS.map((island) => (
          <option key={island.id} value={island.id}>{island.name} ({COUNTRY_NAMES[island.country]})</option>
        ))}
      </select>
    </label>
  )

  return (
    <div className="mt-16 border-t border-ivory/20 pt-10">
      <h3 className="text-3xl">Cara a cara</h3>
      <div className="mt-6 grid grid-cols-[1fr_1fr] gap-x-4 md:grid-cols-[1fr_12rem_1fr]">
        {picker(leftId, setLeft, 'Primera isla')}
        <span className="hidden md:block" />
        {picker(rightId, setRight, 'Segunda isla')}
      </div>
      <dl className="mt-4">
        {SCORE_KEYS.map((key) => (
          <div key={key} className="grid grid-cols-2 items-center gap-x-4 border-b border-ivory/10 py-2 md:grid-cols-[1fr_12rem_1fr]">
            <dt className="col-span-2 text-center text-sm text-ivory/70 md:col-span-1 md:col-start-2 md:row-start-1">{SCORE_LABELS[key]}</dt>
            {pair.map((island, index) => (
              <dd key={`${index}-${island.id}`} className={`m-0 md:row-start-1 ${index === 0 ? 'md:col-start-1 md:justify-self-end' : 'justify-self-end md:col-start-3 md:justify-self-start'}`}>
                <Dots value={island.scores[key]} label={`${island.name}, ${SCORE_LABELS[key]}`} tone="dark" />
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </div>
  )
}

export function IslandExplorer() {
  const [filter, setFilter] = useState<IslandScoreKey | null>(null)
  const [selectedId, setSelectedId] = useState(ISLANDS[0]?.id ?? '')
  const ranked = useMemo(() => rankIslands(filter), [filter])
  const island = findIsland(selectedId)

  const applyFilter = (key: IslandScoreKey) => {
    const next = filter === key ? null : key
    setFilter(next)
    const first = rankIslands(next)[0]
    if (first && next) setSelectedId(first.id)
  }

  return (
    <section id="islas" className="bg-ocean-950 px-5 py-24 text-ivory md:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Islas" title="Elige tu isla" tone="dark">
          <p>Nueve islas frente a frente. Las puntuaciones son valoraciones editoriales y subjetivas, no un ranking científico.</p>
        </SectionHeading>

        <div role="group" aria-label="Filtrar islas" className="mt-8 flex flex-wrap gap-2">
          {ISLAND_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => applyFilter(key)}
              className={`min-h-11 border px-4 text-sm transition-colors ${
                filter === key ? 'border-gold-500 bg-gold-500 font-semibold text-ocean-950' : 'border-ivory/30 hover:border-ivory'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative mt-8 grid overflow-hidden lg:grid-cols-12">
          <div className="relative min-h-72 sm:min-h-96 lg:col-span-8 lg:min-h-[640px]">
            <AnimatePresence initial={false}>
              <m.div key={island.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
                <Photo id={island.image} sizes="(min-width: 1024px) 66vw, 100vw" className="size-full" />
              </m.div>
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ocean-950/90 to-transparent p-6 pt-24 md:p-8 md:pt-32">
              <p className="eyebrow text-gold-500">{COUNTRY_NAMES[island.country]} · {island.tagline}</p>
              <h3 className="mt-2 text-5xl md:text-7xl" data-testid="island-name">{island.name}</h3>
            </div>
          </div>

          <div className="bg-ocean-900 p-6 md:p-8 lg:col-span-4">
            <p>{island.description}</p>
            <dl className="mt-5 space-y-1.5">
              {SCORE_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between gap-4 text-sm">
                  <dt className={filter === key ? 'font-semibold text-gold-500' : 'text-ivory/80'}>{SCORE_LABELS[key]}</dt>
                  <dd><Dots value={island.scores[key]} label={SCORE_LABELS[key]} tone="dark" /></dd>
                </div>
              ))}
            </dl>
            <dl className="mt-5 space-y-3 border-t border-ivory/15 pt-5 text-sm">
              <div><dt className="font-semibold">Duración típica</dt><dd className="text-ivory/80">{island.duration}</dd></div>
              <div><dt className="font-semibold">Cómo llegar</dt><dd className="text-ivory/80">{island.access}</dd></div>
              <div><dt className="font-semibold">¿Excursión o noche?</dt><dd className="text-ivory/80">{island.stay}</dd></div>
              <div><dt className="font-semibold">Temporada</dt><dd className="text-ivory/80">{island.season}</dd></div>
            </dl>
          </div>
        </div>

        <ul aria-label="Islas" className="no-scrollbar -mx-5 mt-3 flex snap-x gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
          {ranked.map((candidate) => (
            <li key={candidate.id} className="w-36 shrink-0 snap-start lg:w-auto lg:flex-1">
              <button
                type="button"
                aria-pressed={candidate.id === island.id}
                onClick={() => setSelectedId(candidate.id)}
                className={`group relative block w-full overflow-hidden border-b-3 text-left ${
                  candidate.id === island.id ? 'border-gold-500' : 'border-transparent'
                }`}
              >
                <Photo id={candidate.image} alt="" sizes="160px" className="aspect-[4/3] w-full opacity-75 transition-opacity group-hover:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ocean-950 to-transparent px-2 pt-6 pb-1 text-sm font-medium">
                  {candidate.name}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <IslandCompare />
      </div>
    </section>
  )
}
