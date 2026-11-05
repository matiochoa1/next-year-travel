import { useState, type ComponentProps } from 'react'

interface NumberFieldProps extends Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type' | 'min' | 'max'> {
  value: number
  min: number
  max: number
  onValueChange: (value: number) => void
}

/**
 * Keeps what is being typed separate from the committed number, so the field can be empty while
 * editing. Clamping on every keystroke would turn "clear, then type 5" into 15.
 */
export function NumberField({ value, min, max, onValueChange, ...rest }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <input
      {...rest}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft ?? value}
      onFocus={(event) => event.target.select()}
      onChange={(event) => {
        setDraft(event.target.value)
        const parsed = Number(event.target.value)
        if (event.target.value !== '' && Number.isInteger(parsed) && parsed >= min && parsed <= max) onValueChange(parsed)
      }}
      onBlur={() => {
        // An out-of-range number snaps to the nearest limit; an empty field keeps the last value.
        if (draft) onValueChange(Math.min(max, Math.max(min, Math.round(Number(draft)))))
        setDraft(null)
      }}
    />
  )
}
