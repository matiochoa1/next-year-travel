import { Link } from 'react-router'

export function Footer() {
  return (
    <footer className="bg-ocean-950 px-5 py-14 text-ivory/70 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="font-display text-2xl text-ivory">Next Stop: Asia</p>
          <p className="mt-1">Dos países. Un viaje inolvidable.</p>
        </div>
        <div className="max-w-md text-sm md:text-right">
          <p>
            Proyecto privado de un grupo de amigos. Precios, horarios y clima son orientativos: confirmadlos siempre antes de reservar.
          </p>
          <Link to="/creditos" className="link-underline mt-2 inline-block text-ivory">
            Fuentes y créditos de las fotos
          </Link>
        </div>
      </div>
    </footer>
  )
}
