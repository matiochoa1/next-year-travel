import { Link } from 'react-router'
import { IMAGES } from '../components/ui/Photo'

const SOURCES = [
  { name: 'Autoridad de Turismo de Tailandia: cierres estacionales de parques nacionales', url: 'https://www.tatnews.org/thailands-national-park-system-starts-annual-seasonal-closure-of-attractions/' },
  { name: 'Wikipedia: Islas Perhentian (monzón y cierres)', url: 'https://en.wikipedia.org/wiki/Perhentian_Islands' },
  { name: 'Travelfish: guía de las Perhentian', url: 'https://www.travelfish.org/location/malaysia/peninsular_malaysia/terengganu/perhentian_islands' },
  { name: 'Thailand Magazine: clima en mayo', url: 'https://thailandmagazine.com/weather-and-climate-thailand/weather-in-may/' },
  { name: 'Black Turtle Dive: clima en Koh Tao', url: 'https://www.blackturtledive.com/koh-tao/weather/' },
  { name: 'Inmigración de Tailandia: tarjeta digital TDAC', url: 'https://tdac.immigration.go.th' },
]

export default function CreditsPage() {
  const images = Object.values(IMAGES)
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-16">
      <Link to="/" className="link-underline text-sm">Volver al viaje</Link>
      <h1 className="mt-4 text-5xl">Fuentes y créditos</h1>

      <h2 className="mt-12 text-3xl">Cómo leer esta web</h2>
      <p className="mt-3">
        Las puntuaciones son valoraciones editoriales y subjetivas. Los itinerarios son ejemplos: no confirman plazas, horarios ni conexiones.
        Los presupuestos son supuestos de planificación, no precios reales. El clima refleja patrones históricos, no una previsión para 2027.
      </p>

      <h2 className="mt-12 text-3xl">Fuentes de viaje</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {SOURCES.map(({ name, url }) => (
          <li key={url}><a href={url} rel="noreferrer" target="_blank" className="link-underline">{name}</a></li>
        ))}
      </ul>

      <h2 className="mt-12 text-3xl">Mapas</h2>
      <p className="mt-3">
        Cartografía de <a className="link-underline" href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">© colaboradores de OpenStreetMap</a>,
        servida por <a className="link-underline" href="https://openfreemap.org" rel="noreferrer" target="_blank">OpenFreeMap</a> y <a className="link-underline" href="https://openmaptiles.org" rel="noreferrer" target="_blank">OpenMapTiles</a>.
      </p>

      <h2 className="mt-12 text-3xl">Fotografías</h2>
      <p className="mt-3">Todas proceden de Wikimedia Commons y se han redimensionado para la web.</p>
      <ul className="mt-4 space-y-2 text-sm">
        {images.map((image) => (
          <li key={image.id}>
            <a href={image.sourceUrl} rel="noreferrer" target="_blank" className="link-underline">{image.place}</a>
            {' · '}{image.author}{' · '}
            {image.licenseUrl
              ? <a href={image.licenseUrl} rel="noreferrer" target="_blank" className="link-underline">{image.license}</a>
              : image.license}
          </li>
        ))}
      </ul>
    </main>
  )
}
