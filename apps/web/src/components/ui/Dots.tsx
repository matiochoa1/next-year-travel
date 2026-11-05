export function Dots({ value, max = 5, label, tone = 'light' }: { value: number; max?: number; label: string; tone?: 'light' | 'dark' }) {
  return (
    <span role="img" aria-label={`${label}: ${value} de ${max}`} className="inline-flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`size-2 rounded-full ${
            i < value ? (tone === 'dark' ? 'bg-aqua-300' : 'bg-aqua-600') : tone === 'dark' ? 'bg-ivory/20' : 'bg-sand-200'
          }`}
        />
      ))}
    </span>
  )
}
