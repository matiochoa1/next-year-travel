import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  className?: string
}

/** Native <dialog> gives focus trapping, Escape handling and inert background for free. */
export function Dialog({ open, onClose, label, children, className = '' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className={`m-auto max-h-none max-w-none backdrop:bg-ocean-950/80 ${className}`}
    >
      {open && children}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-3 right-3 flex size-11 items-center justify-center bg-ocean-950/70 text-ivory"
      >
        <X aria-hidden className="size-5" />
      </button>
    </dialog>
  )
}
