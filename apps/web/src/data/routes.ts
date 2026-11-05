import type { RegionId } from './seasons'
import type { Country } from './types'

export type PlaceKind = 'city' | 'temple' | 'island' | 'nature' | 'transfer'
export type TransportMode = 'flight' | 'ferry' | 'boat' | 'road' | 'rail'

export interface Place {
  id: string
  name: string
  country: Country
  lat: number
  lng: number
  kind: PlaceKind
  region: string
  blurb: string
  image: string
}

export interface Leg {
  from: string
  to: string
  mode: TransportMode
  note: string
  /** The leg uses a real fixed link between a mainland and an island. */
  bridge?: boolean
}

export interface Stop {
  place: string
  label: string
  dayTrip?: boolean
}

export interface Route {
  id: string
  country: Country
  name: string
  tier: 'recommended' | 'alternative'
  summary: string
  /** Sea region whose season decides whether the route makes sense in a given month. */
  seaRegion: RegionId
  regions: RegionId[]
  stops: Stop[]
  legs: Leg[]
  /** Routes that do not fit a 15-day trip together with the main itinerary. */
  caveat?: string
}

const placeList: Place[] = [
  { id: 'bangkok', name: 'Bangkok', country: 'thailand', lat: 13.7563, lng: 100.5018, kind: 'city', region: 'Centro', blurb: 'Templos, canales, mercados y la mejor comida callejera del viaje.', image: 'th-grandpalace' },
  { id: 'ayutthaya', name: 'Ayutthaya', country: 'thailand', lat: 14.3532, lng: 100.5689, kind: 'temple', region: 'Centro', blurb: 'Antigua capital de Siam, Patrimonio de la Humanidad, a un día desde Bangkok.', image: 'th-ayutthaya' },
  { id: 'chiangmai', name: 'Chiang Mai', country: 'thailand', lat: 18.7883, lng: 98.9853, kind: 'city', region: 'Norte', blurb: 'Casco antiguo amurallado, templos lanna y montañas alrededor.', image: 'th-chedi' },
  { id: 'samui', name: 'Koh Samui', country: 'thailand', lat: 9.512, lng: 100.0136, kind: 'island', region: 'Golfo', blurb: 'La isla más grande y conectada del Golfo, con aeropuerto propio.', image: 'th-samui' },
  { id: 'angthong', name: 'Ang Thong', country: 'thailand', lat: 9.63, lng: 99.67, kind: 'nature', region: 'Golfo', blurb: 'Parque marino de más de 40 islas calizas, con miradores y lagunas.', image: 'th-angthong3' },
  { id: 'phangan', name: 'Koh Phangan', country: 'thailand', lat: 9.74, lng: 100.02, kind: 'island', region: 'Golfo', blurb: 'Selva, calas remotas y fiesta, todo en la misma isla.', image: 'th-phangan2' },
  { id: 'tao', name: 'Koh Tao', country: 'thailand', lat: 10.0956, lng: 99.8404, kind: 'island', region: 'Golfo', blurb: 'Isla pequeña, muy centrada en el buceo y el snórkel.', image: 'th-tao' },
  { id: 'nangyuan', name: 'Koh Nang Yuan', country: 'thailand', lat: 10.1195, lng: 99.8125, kind: 'nature', region: 'Golfo', blurb: 'Tres islotes unidos por lenguas de arena, junto a Koh Tao.', image: 'th-nangyuan' },
  { id: 'krabi', name: 'Krabi', country: 'thailand', lat: 8.0863, lng: 98.9063, kind: 'city', region: 'Andamán', blurb: 'Puerta de entrada al paisaje calizo del Andamán.', image: 'th-longtail' },
  { id: 'railay', name: 'Railay', country: 'thailand', lat: 8.0115, lng: 98.8377, kind: 'nature', region: 'Andamán', blurb: 'Península accesible por barco, famosa por sus acantilados.', image: 'th-railay' },
  { id: 'phiphi', name: 'Koh Phi Phi', country: 'thailand', lat: 7.7407, lng: 98.7784, kind: 'island', region: 'Andamán', blurb: 'Icono del Andamán, con Maya Bay y mucho ambiente.', image: 'th-phiphi' },
  { id: 'lanta', name: 'Koh Lanta', country: 'thailand', lat: 7.6247, lng: 99.0418, kind: 'island', region: 'Andamán', blurb: 'Isla larga y tranquila, de atardeceres sobre el mar.', image: 'th-lanta' },

  { id: 'kl', name: 'Kuala Lumpur', country: 'malaysia', lat: 3.139, lng: 101.6869, kind: 'city', region: 'Selangor', blurb: 'Capital multicultural de rascacielos, mezquitas y comida a todas horas.', image: 'my-petronas' },
  { id: 'batu', name: 'Batu Caves', country: 'malaysia', lat: 3.2379, lng: 101.684, kind: 'temple', region: 'Selangor', blurb: 'Santuario hindú en cuevas calizas, en las afueras de la capital.', image: 'my-batu' },
  { id: 'cameron', name: 'Cameron Highlands', country: 'malaysia', lat: 4.4721, lng: 101.3801, kind: 'nature', region: 'Pahang', blurb: 'Plantaciones de té y bosque nublado a unos 1.500 metros.', image: 'my-cameron2' },
  { id: 'penang', name: 'George Town', country: 'malaysia', lat: 5.4141, lng: 100.3288, kind: 'city', region: 'Penang', blurb: 'Casco histórico Patrimonio de la Humanidad y capital gastronómica.', image: 'my-jetty' },
  { id: 'kotabharu', name: 'Kota Bharu', country: 'malaysia', lat: 6.1254, lng: 102.2381, kind: 'transfer', region: 'Kelantan', blurb: 'Base de paso con aeropuerto y gran mercado central.', image: 'my-kotabharu' },
  { id: 'kualabesut', name: 'Kuala Besut', country: 'malaysia', lat: 5.8306, lng: 102.5567, kind: 'transfer', region: 'Terengganu', blurb: 'Embarcadero de las lanchas hacia las Perhentian.', image: 'my-kotabharu' },
  { id: 'kecil', name: 'Perhentian Kecil', country: 'malaysia', lat: 5.9139, lng: 102.7222, kind: 'island', region: 'Terengganu', blurb: 'La isla “pequeña”, con ambiente mochilero y Long Beach.', image: 'my-kecil' },
  { id: 'besar', name: 'Perhentian Besar', country: 'malaysia', lat: 5.899, lng: 102.756, kind: 'island', region: 'Terengganu', blurb: 'La isla “grande”, más tranquila y con resorts sencillos.', image: 'my-besar' },
  { id: 'redang', name: 'Pulau Redang', country: 'malaysia', lat: 5.7833, lng: 103.0167, kind: 'island', region: 'Terengganu', blurb: 'Parque marino con arena muy blanca y resorts de paquete.', image: 'my-redang2' },
  { id: 'langtengah', name: 'Lang Tengah', country: 'malaysia', lat: 5.795, lng: 102.895, kind: 'island', region: 'Terengganu', blurb: 'Isla diminuta y muy tranquila, entre Perhentian y Redang.', image: 'my-langtengah' },
  { id: 'langkawi', name: 'Langkawi', country: 'malaysia', lat: 6.3167, lng: 99.8167, kind: 'island', region: 'Kedah', blurb: 'Archipiélago de la costa oeste, con otra estacionalidad.', image: 'my-langkawi' },
  { id: 'semporna', name: 'Semporna', country: 'malaysia', lat: 4.4818, lng: 118.611, kind: 'transfer', region: 'Sabah', blurb: 'Base en Borneo para las islas de Sipadan y Mabul.', image: 'my-sipadan' },
  { id: 'sipadan', name: 'Sipadan', country: 'malaysia', lat: 4.1147, lng: 118.6287, kind: 'island', region: 'Sabah', blurb: 'Uno de los puntos de buceo más célebres del mundo, con permisos limitados.', image: 'my-sipadan2' },
]

export const PLACES = Object.fromEntries(placeList.map((p) => [p.id, p])) as Record<string, Place>

export const ROUTES: Route[] = [
  {
    id: 'th-gulf', country: 'thailand', tier: 'recommended', name: 'Golfo de Tailandia',
    summary: 'Ciudad, templos, norte e islas del Golfo. Es la recomendación principal para mayo.',
    seaRegion: 'gulf', regions: ['bangkok', 'chiangmai', 'gulf'],
    stops: [
      { place: 'bangkok', label: 'Bangkok' },
      { place: 'ayutthaya', label: 'Ayutthaya', dayTrip: true },
      { place: 'chiangmai', label: 'Chiang Mai' },
      { place: 'samui', label: 'Koh Samui' },
      { place: 'angthong', label: 'Parque Marino de Ang Thong', dayTrip: true },
      { place: 'phangan', label: 'Koh Phangan' },
      { place: 'tao', label: 'Koh Tao' },
      { place: 'nangyuan', label: 'Koh Nang Yuan', dayTrip: true },
    ],
    legs: [
      { from: 'bangkok', to: 'ayutthaya', mode: 'rail', note: 'Excursión de un día en tren o furgoneta' },
      { from: 'bangkok', to: 'chiangmai', mode: 'flight', note: 'Vuelo doméstico' },
      { from: 'chiangmai', to: 'samui', mode: 'flight', note: 'Directo si la temporada lo ofrece; si no, con conexión en Bangkok' },
      { from: 'samui', to: 'angthong', mode: 'boat', note: 'Excursión en barco desde Samui' },
      { from: 'samui', to: 'phangan', mode: 'ferry', note: 'Ferry o catamarán' },
      { from: 'phangan', to: 'tao', mode: 'ferry', note: 'Catamarán; sensible al estado del mar' },
      { from: 'tao', to: 'nangyuan', mode: 'boat', note: 'Taxi-barco o barca de cola larga' },
    ],
  },
  {
    id: 'th-andaman', country: 'thailand', tier: 'alternative', name: 'Andamán (estación seca)',
    summary: 'El clásico de noviembre a abril. En mayo, Krabi, Phuket y Phi Phi pueden tener condiciones de mar cada vez menos favorables.',
    seaRegion: 'andaman', regions: ['bangkok', 'chiangmai', 'andaman'],
    stops: [
      { place: 'bangkok', label: 'Bangkok' },
      { place: 'chiangmai', label: 'Chiang Mai' },
      { place: 'krabi', label: 'Krabi' },
      { place: 'railay', label: 'Railay' },
      { place: 'phiphi', label: 'Koh Phi Phi' },
      { place: 'lanta', label: 'Koh Lanta' },
    ],
    legs: [
      { from: 'bangkok', to: 'chiangmai', mode: 'flight', note: 'Vuelo doméstico' },
      { from: 'chiangmai', to: 'krabi', mode: 'flight', note: 'Vuelo; puede requerir conexión' },
      { from: 'krabi', to: 'railay', mode: 'boat', note: 'Barca de cola larga: Railay no tiene acceso por carretera' },
      { from: 'railay', to: 'phiphi', mode: 'ferry', note: 'Ferry; servicio sujeto a temporada' },
      { from: 'phiphi', to: 'lanta', mode: 'ferry', note: 'Ferry; servicio sujeto a temporada' },
    ],
  },
  {
    id: 'my-east', country: 'malaysia', tier: 'recommended', name: 'Costa este y Perhentian',
    summary: 'Capital, tierras altas, Penang y las Perhentian, justo en su temporada. Es la recomendación principal para mayo.',
    seaRegion: 'eastcoast', regions: ['kl', 'cameron', 'penang', 'eastcoast'],
    stops: [
      { place: 'kl', label: 'Kuala Lumpur' },
      { place: 'batu', label: 'Batu Caves', dayTrip: true },
      { place: 'cameron', label: 'Cameron Highlands' },
      { place: 'penang', label: 'George Town / Penang' },
      { place: 'kotabharu', label: 'Kota Bharu' },
      { place: 'kualabesut', label: 'Kuala Besut' },
      { place: 'kecil', label: 'Perhentian Kecil' },
      { place: 'besar', label: 'Perhentian Besar', dayTrip: true },
    ],
    legs: [
      { from: 'kl', to: 'batu', mode: 'rail', note: 'Tren de cercanías o coche' },
      { from: 'kl', to: 'cameron', mode: 'road', note: 'Autobús o coche con carreteras de montaña' },
      { from: 'cameron', to: 'penang', mode: 'road', note: 'Furgoneta o coche; entra por el puente de Penang', bridge: true },
      { from: 'penang', to: 'kotabharu', mode: 'road', note: 'Por carretera este-oeste, o vuelo si hay plazas', bridge: true },
      { from: 'kotabharu', to: 'kualabesut', mode: 'road', note: 'Taxi o transfer hasta el embarcadero' },
      { from: 'kualabesut', to: 'kecil', mode: 'boat', note: 'Lancha rápida; depende del mar' },
      { from: 'kecil', to: 'besar', mode: 'boat', note: 'Taxi-barco entre islas' },
    ],
  },
  {
    id: 'my-west', country: 'malaysia', tier: 'alternative', name: 'Costa oeste y Langkawi',
    summary: 'La opción para cuando la costa este cierra por monzón, de noviembre a febrero. En mayo Langkawi entra en temporada baja.',
    seaRegion: 'langkawi', regions: ['kl', 'cameron', 'penang', 'langkawi'],
    stops: [
      { place: 'kl', label: 'Kuala Lumpur' },
      { place: 'cameron', label: 'Cameron Highlands' },
      { place: 'penang', label: 'George Town / Penang' },
      { place: 'langkawi', label: 'Langkawi' },
    ],
    legs: [
      { from: 'kl', to: 'cameron', mode: 'road', note: 'Autobús o coche' },
      { from: 'cameron', to: 'penang', mode: 'road', note: 'Furgoneta o coche', bridge: true },
      { from: 'penang', to: 'langkawi', mode: 'flight', note: 'Vuelo corto; también existe ferry según temporada' },
    ],
  },
  {
    id: 'my-sabah', country: 'malaysia', tier: 'alternative', name: 'Sabah y Semporna',
    summary: 'Una aventura sustancialmente distinta, centrada en el buceo en Borneo.',
    caveat: 'Sustituye a las Perhentian: no cabe en 15 días junto a la ruta principal, y exige vuelos internos y reservar permisos de Sipadan con mucha antelación.',
    seaRegion: 'sabah', regions: ['kl', 'sabah'],
    stops: [
      { place: 'kl', label: 'Kuala Lumpur' },
      { place: 'semporna', label: 'Semporna' },
      { place: 'sipadan', label: 'Sipadan', dayTrip: true },
    ],
    legs: [
      { from: 'kl', to: 'semporna', mode: 'flight', note: 'Vuelo a Tawau y traslado por carretera a Semporna' },
      { from: 'semporna', to: 'sipadan', mode: 'boat', note: 'Lancha con permiso de buceo' },
    ],
  },
  {
    id: 'my-redang', country: 'malaysia', tier: 'alternative', name: 'Redang y Lang Tengah',
    summary: 'Alternativas a las Perhentian en la misma costa y con la misma temporada.',
    caveat: 'Son opciones excluyentes con las Perhentian en 15 días, no paradas adicionales: cada isla pide al menos dos o tres noches.',
    seaRegion: 'eastcoast', regions: ['kl', 'eastcoast'],
    stops: [
      { place: 'kl', label: 'Kuala Lumpur' },
      { place: 'redang', label: 'Pulau Redang' },
      { place: 'langtengah', label: 'Lang Tengah' },
    ],
    legs: [
      { from: 'kl', to: 'redang', mode: 'flight', note: 'Vuelo a Kuala Terengganu y barco hasta la isla' },
      { from: 'redang', to: 'langtengah', mode: 'boat', note: 'Barco contratado; no hay línea regular garantizada' },
    ],
  },
]

export const MODE_LABELS: Record<TransportMode, string> = {
  flight: 'Vuelo',
  ferry: 'Ferry',
  boat: 'Barco',
  road: 'Carretera',
  rail: 'Tren',
}

export const routesFor = (country: Country) => ROUTES.filter((r) => r.country === country)
