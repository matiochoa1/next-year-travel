import { BUDGET_AMOUNT_MAX, BUDGET_NOTE_MAX, type BudgetCategory, type BudgetItemView } from '@nsa/shared'
import { Pencil } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { CATEGORY_LABELS, CATEGORY_UNITS, type Range } from '../../data/budget'
import { COUNTRY_NAMES, type Country } from '../../data/types'
import { VotingError, type VotingClient } from '../voting/client'
import { formatRange } from './calculateBudget'

interface BudgetItemProps {
  client: VotingClient
  country: Country
  category: BudgetCategory
  /** Per-unit price shown in the editor. */
  base: Range
  /** Scaled to the trip, shown in the summary. */
  total: Range
  maxHigh: number
  item: BudgetItemView | undefined
  canEdit: boolean
  onChanged: () => Promise<void>
}

const fieldClass = 'mt-1 min-h-11 w-full border border-sand-400 bg-ivory px-2 tabular-nums'

export function BudgetItem({ client, country, category, base, total, maxHigh, item, canEdit, onChanged }: BudgetItemProps) {
  const [editing, setEditing] = useState(false)
  const [low, setLow] = useState('')
  const [high, setHigh] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = `${CATEGORY_LABELS[category]}, ${COUNTRY_NAMES[country]}`

  const open = () => {
    setLow(String(base.low))
    setHigh(String(base.high))
    setNote(item?.note ?? '')
    setError(null)
    setEditing(true)
  }

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      await onChanged()
      setEditing(false)
    } catch (caught) {
      if (caught instanceof VotingError && caught.code === 'version_conflict') {
        await onChanged()
        setError('Alguien acaba de cambiar este precio. Revisa el valor nuevo y vuelve a guardar.')
      } else {
        setError('No se ha podido guardar. Inténtalo de nuevo.')
      }
    } finally {
      setBusy(false)
    }
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    const [lowValue, highValue] = [Number(low), Number(high)]
    const valid = [lowValue, highValue].every((value) => Number.isInteger(value) && value >= 0 && value <= BUDGET_AMOUNT_MAX)
    if (!valid || lowValue > highValue) {
      setError('Usa euros enteros, con el mínimo igual o menor que el máximo.')
      return
    }
    void run(() =>
      client.saveBudgetItem({ country, category, low: lowValue, high: highValue, note, expectedVersion: item?.version ?? null }),
    )
  }

  return (
    <div data-testid={`item-${country}-${category}`}>
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-muted">{COUNTRY_NAMES[country]}</span>
        <span className="tabular-nums">{formatRange(total)}</span>
      </div>
      <div className="relative mt-1 h-1.5 bg-sand-200">
        <span
          className={`absolute inset-y-0 min-w-1 ${country === 'thailand' ? 'bg-emerald-700' : 'bg-gold-700'}`}
          style={{ left: `${(total.low / maxHigh) * 100}%`, width: `${((total.high - total.low) / maxHigh) * 100}%` }}
        />
      </div>
      <div className="mt-1 flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs break-words text-muted">
          {item ? (
            <>
              {item.updatedBy} · {new Date(item.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              {/* Rendered as text: React escapes whatever a friend typed. */}
              {item.note && <span className="text-ink"> · {item.note}</span>}
            </>
          ) : (
            'Estimación inicial'
          )}
        </p>
        {canEdit && !editing && (
          <button type="button" onClick={open} aria-label={`Editar ${name}`} className="-my-2 flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium">
            <Pencil aria-hidden className="size-3.5" /> Editar
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={save} className="mt-2 space-y-2 border-l-2 border-gold-500 pl-3">
          <p className="text-xs text-muted">Importes en {CATEGORY_UNITS[category]}.</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-medium">
              Mínimo
              <input aria-label={`${name}, mínimo`} type="number" inputMode="numeric" min={0} value={low} onChange={(event) => setLow(event.target.value)} className={fieldClass} />
            </label>
            <label className="text-sm font-medium">
              Máximo
              <input aria-label={`${name}, máximo`} type="number" inputMode="numeric" min={0} value={high} onChange={(event) => setHigh(event.target.value)} className={fieldClass} />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Nota <span className="font-normal text-muted">(opcional)</span>
            <input aria-label={`${name}, nota`} value={note} maxLength={BUDGET_NOTE_MAX} onChange={(event) => setNote(event.target.value)} placeholder="Ej.: Qatar con una escala, visto en eDreams" className="mt-1 min-h-11 w-full border border-sand-400 bg-ivory px-2" />
          </label>
          {error && <p role="alert" className="text-sm text-coral">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="min-h-11 bg-ocean-900 px-4 text-sm font-medium text-ivory disabled:opacity-50">Guardar para todos</button>
            <button type="button" onClick={() => setEditing(false)} className="link-underline min-h-11 text-sm">Cancelar</button>
            {item && (
              <button type="button" disabled={busy} onClick={() => void run(() => client.resetBudgetItem(country, category))} className="link-underline min-h-11 text-sm text-coral">
                Volver a la estimación inicial
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
