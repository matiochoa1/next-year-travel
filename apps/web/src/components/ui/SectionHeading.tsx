import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

interface SectionHeadingProps {
  eyebrow: string
  title: ReactNode
  children?: ReactNode
  tone?: 'light' | 'dark'
}

export function SectionHeading({ eyebrow, title, children, tone = 'light' }: SectionHeadingProps) {
  const dark = tone === 'dark'
  return (
    <Reveal className="max-w-3xl">
      <p className={`eyebrow ${dark ? 'text-gold-500' : 'text-gold-700'}`}>{eyebrow}</p>
      <h2 className="mt-4 text-4xl md:text-6xl">{title}</h2>
      {children && (
        <div className={`mt-5 max-w-2xl text-lg ${dark ? 'text-ivory/80' : 'text-muted'}`}>{children}</div>
      )}
    </Reveal>
  )
}
