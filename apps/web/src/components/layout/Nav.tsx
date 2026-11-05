import { Menu } from 'lucide-react'
import { useScroll, m, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'
import { Dialog } from '../ui/Dialog'

export const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'destinos', label: 'Destinos' },
  { id: 'rutas', label: 'Rutas' },
  { id: 'islas', label: 'Islas' },
  { id: 'comparativa', label: 'Comparativa' },
  { id: 'presupuesto', label: 'Presupuesto' },
  { id: 'votacion', label: 'Votación' },
]

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const [active, setActive] = useState('inicio')
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.7)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    const observeAll = () => {
      for (const { id } of NAV_ITEMS) {
        const element = document.getElementById(id)
        if (element) observer.observe(element)
      }
    }
    observeAll()
    // Below-the-fold sections arrive in a lazy chunk.
    const mutation = new MutationObserver(observeAll)
    mutation.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      mutation.disconnect()
    }
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        solid ? 'bg-ocean-950/95 text-ivory shadow-lg backdrop-blur-sm' : 'bg-transparent text-ivory'
      }`}
    >
      <nav aria-label="Principal" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <a href="#inicio" className="font-display text-lg font-semibold tracking-tight">
          Next Stop<span className="text-gold-500">:</span> Asia
        </a>

        <ul className="hidden items-center gap-7 text-sm lg:flex">
          {NAV_ITEMS.slice(1).map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? 'true' : undefined}
                className={`py-2 transition-colors ${active === id ? 'text-gold-500' : 'text-ivory/85 hover:text-ivory'}`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 lg:hidden">
          <a href="#votacion" className="flex min-h-11 items-center bg-gold-500 px-4 text-sm font-semibold text-ocean-950">
            Votar
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="flex size-11 items-center justify-center"
          >
            <Menu aria-hidden className="size-6" />
          </button>
        </div>
      </nav>

      <m.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gold-500"
        style={{ scaleX: progress }}
      />

      <Dialog
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        label="Menú de navegación"
        className="h-dvh w-screen bg-ocean-950 text-ivory"
      >
        <ul className="flex h-full flex-col justify-center gap-1 px-8">
          {NAV_ITEMS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={() => setMenuOpen(false)}
                className="block py-3 font-display text-4xl"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </Dialog>
    </header>
  )
}
