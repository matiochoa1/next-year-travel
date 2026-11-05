import { ArrowDown } from 'lucide-react'
import { m, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useState, type PointerEvent } from 'react'
import { Photo } from '../../components/ui/Photo'
import type { Country } from '../../data/types'
import { useTrip } from '../../store/tripStore'

const PANES: Array<{ country: Country; name: string; image: string; intro: string; tags: string }> = [
  {
    country: 'thailand', name: 'Tailandia', image: 'th-angthong3',
    intro: 'Islas calizas, templos dorados y noches que no acaban.',
    tags: 'Bangkok · Chiang Mai · Golfo',
  },
  {
    country: 'malaysia', name: 'Malasia', image: 'my-langtengah',
    intro: 'Agua transparente, selva, té y las mejores cocinas de Asia.',
    tags: 'Kuala Lumpur · Penang · Perhentian',
  },
]

const FACTS = ['Mayo 2027', '14–16 días', 'Desde Madrid']

export function Hero() {
  const [active, setActive] = useState<Country | null>(null)
  const setCountry = useTrip((state) => state.setCountry)
  const reduced = useReducedMotion()

  const { scrollY } = useScroll()
  const scrollDrift = useTransform(scrollY, [0, 900], [0, reduced ? 0 : 90])
  const pointerX = useMotionValue(0)
  const pointerSpring = useSpring(pointerX, { stiffness: 40, damping: 18 })

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reduced || event.pointerType !== 'mouse') return
    pointerX.set((event.clientX / window.innerWidth - 0.5) * -22)
  }

  return (
    <section id="inicio" aria-label="Portada" className="relative h-svh min-h-[640px] overflow-hidden bg-ocean-950 text-ivory" onPointerMove={onPointerMove}>
      {/* Desktop: two competing panes sharing a moving diagonal */}
      <div className="hero-stage absolute inset-0 hidden md:block" data-active={active ?? undefined}>
        {PANES.map(({ country, image }, index) => (
          <div key={country} className={`absolute inset-0 ${country === 'thailand' ? 'hero-pane-th' : 'hero-pane-my'}`}>
            <m.div className="absolute -inset-10" style={{ y: scrollDrift, x: pointerSpring }}>
              <Photo
                id={image}
                alt=""
                priority={index === 0}
                sizes="75vw"
                className={`size-full transition-[filter] duration-700 ${
                  active && active !== country ? 'brightness-[0.45] saturate-50' : ''
                }`}
              />
            </m.div>
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/85 via-ocean-950/15 to-ocean-950/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/50 via-ocean-950/10 to-transparent" />
        <div aria-hidden className="hero-divider" />
      </div>

      {/* Mobile: stacked panes, no hover required */}
      <div className="absolute inset-0 grid grid-rows-2 md:hidden">
        {PANES.map(({ country, image }, index) => (
          <div key={country} className="relative overflow-hidden">
            <Photo id={image} alt="" priority={index === 0} sizes="100vw" className="absolute inset-0 size-full" />
            <div className="absolute inset-0 bg-ocean-950/25" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-950/55 via-transparent to-ocean-950/40" />
      </div>

      <div className="relative z-10 flex h-full flex-col px-5 pt-24 pb-6 md:px-8 md:pt-28">
        <div className="mx-auto w-full max-w-7xl flex-1">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <ul className="eyebrow flex flex-wrap gap-x-5 gap-y-1 text-gold-500 [text-shadow:0_1px_8px_rgb(6_24_38/0.8)]">
              {FACTS.map((fact) => <li key={fact}>{fact}</li>)}
            </ul>
            <h1 className="mt-4 text-5xl [text-shadow:0_2px_24px_rgb(6_24_38/0.55)] sm:text-6xl lg:text-8xl">
              ¿Cuál será nuestra próxima aventura?
            </h1>
            <p className="mt-4 max-w-xl text-lg text-ivory/95 [text-shadow:0_1px_10px_rgb(6_24_38/0.8)] md:text-xl">
              15 días. Dos países increíbles. Una decisión que tomamos entre todos.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#aventura" className="flex min-h-12 items-center bg-gold-500 px-6 font-semibold text-ocean-950 transition-colors hover:bg-ivory">
                Descubrir el viaje
              </a>
              <a href="#comparativa" className="flex min-h-12 items-center border border-ivory/70 bg-ocean-950/30 px-6 font-semibold backdrop-blur-sm transition-colors hover:bg-ivory hover:text-ocean-950">
                Comparar destinos
              </a>
            </div>
          </m.div>
        </div>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 items-end gap-4">
          {PANES.map(({ country, name, intro, tags }) => (
            <a
              key={country}
              href="#destinos"
              onClick={() => setCountry(country)}
              onMouseEnter={() => setActive(country)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(country)}
              onBlur={() => setActive(null)}
              className={`group block ${country === 'malaysia' ? 'text-right' : ''}`}
            >
              <span className="block font-display text-3xl [text-shadow:0_2px_16px_rgb(6_24_38/0.7)] md:text-5xl">{name}</span>
              <span className="mt-1 hidden text-sm text-ivory/90 md:block">{tags}</span>
              <span
                className={`mt-2 hidden max-w-sm text-ivory transition-all duration-500 md:block ${
                  country === 'malaysia' ? 'ml-auto' : ''
                } ${active === country ? 'opacity-100' : 'translate-y-2 opacity-0'}`}
              >
                {intro}
              </span>
            </a>
          ))}
        </div>

        <div className="mx-auto mt-4 flex w-full max-w-7xl items-center justify-between text-sm">
          <a href="#aventura" aria-label="Seguir bajando" className="flex items-center gap-2 text-ivory/90">
            <ArrowDown aria-hidden className="size-4 motion-safe:animate-[scroll-cue_2.2s_ease-in-out_infinite]" />
            <span className="hidden sm:inline">Sigue bajando</span>
          </a>
          <a href="#votacion" className="link-underline text-ivory/90 hover:text-gold-500">
            Ir directamente a la votación
          </a>
        </div>
      </div>
    </section>
  )
}
