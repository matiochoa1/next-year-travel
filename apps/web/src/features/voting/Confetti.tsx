import { useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'

const COLORS = ['#d9b45b', '#71dcd6', '#faf6ec', '#1c9a78']
const PIECES = 36

/** Pure CSS and non-interactive: it can never block the keyboard or the results behind it. */
export function Confetti() {
  const reduced = useReducedMotion()
  const [done, setDone] = useState(false)
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, index) => ({
        left: (index * 37) % 100,
        delay: (index % 12) * 0.12,
        duration: 2.4 + (index % 5) * 0.3,
        drift: ((index * 53) % 120) - 60,
        spin: 180 + (index * 47) % 540,
        color: COLORS[index % COLORS.length],
      })),
    [],
  )

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (reduced || done) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="absolute -top-4 h-3 w-1.5"
          style={{
            left: `${piece.left}%`,
            background: piece.color,
            animation: `confetti-fall ${piece.duration}s ${piece.delay}s ease-in forwards`,
            '--drift': `${piece.drift}px`,
            '--spin': `${piece.spin}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
