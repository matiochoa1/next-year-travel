import { Plus, Sun } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useState } from 'react'
import { CountrySwitch } from '../../components/ui/CountrySwitch'
import { Dialog } from '../../components/ui/Dialog'
import { IMAGES, Photo } from '../../components/ui/Photo'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { DESTINATIONS, type ExplorerTopic } from '../../data/destinations'
import { useTrip } from '../../store/tripStore'

function TopicRow({ topic, index, open, onToggle }: { topic: ExplorerTopic; index: number; open: boolean; onToggle: () => void }) {
  const panelId = `topic-${topic.id}`
  return (
    <li className="border-t border-sand-200">
      <h4 className="font-sans">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex min-h-16 w-full items-center gap-5 py-4 text-left"
        >
          <span aria-hidden className="w-6 text-sm text-gold-700 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
          <span className="flex-1">
            <span className="block font-display text-2xl tracking-tight md:text-3xl">{topic.title}</span>
            <span className="block text-sm text-muted">{topic.lead}</span>
          </span>
          <Plus aria-hidden className={`size-5 shrink-0 transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
        </button>
      </h4>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 pb-8 md:grid-cols-5">
              <Photo id={topic.image} sizes="(min-width: 768px) 25vw, 100vw" className="aspect-[3/2] w-full md:col-span-2" />
              <div className="md:col-span-3">
                <p>{topic.body}</p>
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium text-emerald-700">
                  {topic.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                </ul>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </li>
  )
}

export function DestinationExplorer() {
  const country = useTrip((state) => state.country)
  const setCountry = useTrip((state) => state.setCountry)
  const [openTopic, setOpenTopic] = useState<string | null>('culture')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const destination = DESTINATIONS[country]
  const lightboxAsset = lightbox ? IMAGES[lightbox] : undefined

  return (
    <section id="destinos" className="bg-ivory px-5 pb-24 md:px-8 md:pb-36">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading eyebrow="Destinos" title="Dos países, dos formas de viajar" />
          <CountrySwitch value={country} onChange={setCountry} label="Elegir país" />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={country}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <div className="relative mt-12">
              <Photo id={destination.heroImage} sizes="100vw" className="h-[46vh] min-h-72 w-full md:h-[64vh]" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ocean-950/85 to-transparent p-6 pt-24 text-ivory md:p-10">
                <p className="eyebrow text-gold-500">{destination.kicker}</p>
                <h3 className="mt-2 text-5xl md:text-7xl">{destination.name}</h3>
              </div>
            </div>

            <div className="mt-12 grid gap-10 md:grid-cols-12">
              <p className="font-display text-2xl leading-snug md:col-span-7 md:text-3xl">{destination.overview}</p>
              <div className="md:col-span-5">
                <h4 className="eyebrow font-sans text-gold-700">Ciudades principales</h4>
                <dl className="mt-3 space-y-3">
                  {destination.cities.map(({ name, text }) => (
                    <div key={name}>
                      <dt className="font-semibold">{name}</dt>
                      <dd className="text-muted">{text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <h4 className="eyebrow mt-16 font-sans text-gold-700">Experiencias imprescindibles</h4>
            <ol className="mt-4 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {destination.signature.map(({ title, text }) => (
                <li key={title} className="border-t-2 border-ocean-900 pt-3">
                  <p className="font-display text-xl">{title}</p>
                  <p className="mt-1 text-muted">{text}</p>
                </li>
              ))}
            </ol>

            <ul className="no-scrollbar -mx-5 mt-14 flex snap-x gap-3 overflow-x-auto px-5 pb-1 md:-mx-8 md:px-8">
              {destination.gallery.map((id) => (
                <li key={id} className="w-72 shrink-0 snap-start md:w-96">
                  <button type="button" onClick={() => setLightbox(id)} aria-label={`Ampliar foto: ${IMAGES[id]?.alt ?? ''}`} className="group block w-full overflow-hidden">
                    <Photo id={id} alt="" sizes="384px" className="aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-105" />
                  </button>
                  <p className="mt-1 text-sm text-muted">{IMAGES[id]?.place}</p>
                </li>
              ))}
            </ul>

            <ul className="mt-14 border-b border-sand-200">
              {destination.topics.map((topic, index) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  index={index}
                  open={openTopic === topic.id}
                  onToggle={() => setOpenTopic(openTopic === topic.id ? null : topic.id)}
                />
              ))}
            </ul>

            <div className="mt-14 grid gap-10 md:grid-cols-3">
              <div>
                <h4 className="text-2xl">Lo mejor</h4>
                <ul className="mt-3 space-y-2">
                  {destination.advantages.map((item) => (
                    <li key={item} className="border-l-2 border-emerald-500 pl-3">{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-2xl">A tener en cuenta</h4>
                <ul className="mt-3 space-y-2">
                  {destination.tradeoffs.map((item) => (
                    <li key={item} className="border-l-2 border-coral pl-3">{item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-ocean-900 p-6 text-ivory">
                <p className="eyebrow flex items-center gap-2 text-gold-500">
                  <Sun aria-hidden className="size-4" /> En mayo
                </p>
                <p className="mt-3 font-display text-2xl">{destination.may.verdict}</p>
                <p className="mt-2 text-ivory/85">{destination.may.text}</p>
              </div>
            </div>
          </m.div>
        </AnimatePresence>
      </div>

      <Dialog
        open={lightbox !== null}
        onClose={() => setLightbox(null)}
        label={lightboxAsset?.alt ?? 'Foto'}
        className="h-dvh w-screen bg-ocean-950"
      >
        {lightbox && (
          <figure className="flex h-full flex-col justify-center gap-3 p-4">
            <Photo id={lightbox} sizes="100vw" className="max-h-[85dvh] w-full object-contain!" style={{ backgroundColor: 'transparent' }} />
            <figcaption className="text-center text-sm text-ivory/80">{lightboxAsset?.alt}</figcaption>
          </figure>
        )}
      </Dialog>
    </section>
  )
}
