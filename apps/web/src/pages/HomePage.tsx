import { lazy, Suspense, useEffect } from 'react'
import { Footer } from '../components/layout/Footer'
import { Nav } from '../components/layout/Nav'
import { Adventure } from '../features/adventure/Adventure'
import { Hero } from '../features/hero/Hero'

const BelowTheFold = lazy(() => import('./BelowTheFold'))

export function HomePage() {
  useEffect(() => {
    // Deep links such as #votacion point at lazily rendered sections.
    const { hash } = window.location
    if (!hash) return
    const timer = setTimeout(() => document.querySelector(hash)?.scrollIntoView(), 400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <a href="#destinos" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-ivory focus:p-3 focus:text-ink">
        Saltar al contenido
      </a>
      <Nav />
      <main>
        <Hero />
        <Adventure />
        <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
          <BelowTheFold />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
