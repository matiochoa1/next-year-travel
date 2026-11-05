import type { Country } from './types'

export type IslandScoreKey = 'snorkeling' | 'diving' | 'beach' | 'adventure' | 'nightlife' | 'peace' | 'hopping'

export interface Island {
  id: string
  name: string
  country: Country
  image: string
  gallery: string[]
  tagline: string
  description: string
  scores: Record<IslandScoreKey, 1 | 2 | 3 | 4 | 5>
  duration: string
  access: string
  stay: string
  season: string
}

export const SCORE_LABELS: Record<IslandScoreKey, string> = {
  snorkeling: 'Snórkel',
  diving: 'Buceo',
  beach: 'Playas',
  adventure: 'Aventura',
  nightlife: 'Vida nocturna',
  peace: 'Tranquilidad',
  hopping: 'Island hopping',
}

export const ISLAND_FILTERS: Array<{ key: IslandScoreKey; label: string }> = [
  { key: 'snorkeling', label: 'Mejor snórkel' },
  { key: 'beach', label: 'Mejores playas' },
  { key: 'adventure', label: 'Más aventura' },
  { key: 'nightlife', label: 'Mejor vida nocturna' },
  { key: 'peace', label: 'Más tranquilas' },
  { key: 'hopping', label: 'Para saltar entre islas' },
]

export const ISLANDS: Island[] = [
  {
    id: 'tao', name: 'Koh Tao', country: 'thailand', image: 'th-tao', gallery: ['th-tao', 'th-tao2'],
    tagline: 'La isla del buceo',
    description: 'Pequeña, con calas rocosas y una comunidad enorme de escuelas de buceo. Sairee concentra el ambiente; el sur y el este son más tranquilos.',
    scores: { snorkeling: 5, diving: 5, beach: 3, adventure: 4, nightlife: 3, peace: 3, hopping: 4 },
    duration: '3 noches', access: 'Catamarán desde Phangan, Samui o Chumphon.',
    stay: 'Pernoctar: es imprescindible para aprovecharla.',
    season: 'Suele ir bien en mayo. El mar se complica sobre todo de octubre a diciembre.',
  },
  {
    id: 'nangyuan', name: 'Koh Nang Yuan', country: 'thailand', image: 'th-nangyuan', gallery: ['th-nangyuan', 'th-nangyuan2'],
    tagline: 'La postal del Golfo',
    description: 'Tres islotes unidos por lenguas de arena, con un mirador de foto y snórkel en la misma orilla. Se llena a media mañana: mejor llegar temprano.',
    scores: { snorkeling: 5, diving: 4, beach: 5, adventure: 3, nightlife: 1, peace: 2, hopping: 4 },
    duration: 'Medio día', access: 'Taxi-barco desde Koh Tao. Tiene entrada y sus propias normas para visitantes.',
    stay: 'Excursión de día: hay un único resort.',
    season: 'Depende del mar, como todo el Golfo. En mayo suele ser accesible.',
  },
  {
    id: 'phangan', name: 'Koh Phangan', country: 'thailand', image: 'th-phangan2', gallery: ['th-phangan2', 'th-phangan', 'th-phangan3'],
    tagline: 'Selva y fiesta',
    description: 'Interior selvático, carreteras empinadas y bahías aisladas en el norte. Más allá de sus famosas fiestas hay una isla sorprendentemente tranquila.',
    scores: { snorkeling: 3, diving: 3, beach: 4, adventure: 4, nightlife: 5, peace: 3, hopping: 3 },
    duration: '2–3 noches', access: 'Ferry desde Samui, o catamarán desde Koh Tao.',
    stay: 'Pernoctar, eligiendo bien la zona según el plan.',
    season: 'Mayo suele ser buena época. Evitad noviembre.',
  },
  {
    id: 'samui', name: 'Koh Samui', country: 'thailand', image: 'th-samui', gallery: ['th-samui', 'th-chaweng'],
    tagline: 'La base cómoda',
    description: 'La isla grande del Golfo, con aeropuerto, buenos hoteles y mucha oferta. Menos salvaje, pero muy práctica como puerta de entrada.',
    scores: { snorkeling: 2, diving: 2, beach: 4, adventure: 2, nightlife: 4, peace: 2, hopping: 4 },
    duration: '2 noches', access: 'Vuelo directo, o ferry desde Surat Thani.',
    stay: 'Pernoctar para enlazar con Ang Thong.',
    season: 'Mayo suele ser agradable. El peor periodo suele ser de octubre a diciembre.',
  },
  {
    id: 'angthong', name: 'Ang Thong', country: 'thailand', image: 'th-angthong', gallery: ['th-angthong', 'th-angthong2', 'th-angthong3'],
    tagline: 'El paisaje de Filipinas',
    description: 'Más de 40 islas calizas forman este parque marino. Se suben miradores, se rema en kayak y se visita una laguna esmeralda interior.',
    scores: { snorkeling: 3, diving: 2, beach: 4, adventure: 5, nightlife: 1, peace: 4, hopping: 5 },
    duration: '1 día', access: 'Excursión en barco desde Samui o Phangan.',
    stay: 'Excursión de día. Hay alojamiento muy básico gestionado por el parque.',
    season: 'Abre en mayo. Suele cerrar por el monzón desde noviembre hasta mediados de diciembre.',
  },
  {
    id: 'kecil', name: 'Perhentian Kecil', country: 'malaysia', image: 'my-kecil', gallery: ['my-kecil', 'my-perhentian', 'my-perhentian3'],
    tagline: 'La pequeña con ambiente',
    description: 'Long Beach para el ambiente y Coral Bay para los atardeceres, unidas por un sendero que cruza la selva. Más joven y económica que Besar.',
    scores: { snorkeling: 5, diving: 4, beach: 5, adventure: 4, nightlife: 2, peace: 3, hopping: 4 },
    duration: '3–4 noches', access: 'Lancha rápida desde Kuala Besut.',
    stay: 'Pernoctar: es la base recomendada.',
    season: 'En plena temporada en mayo. Muchos alojamientos cierran de noviembre a febrero.',
  },
  {
    id: 'besar', name: 'Perhentian Besar', country: 'malaysia', image: 'my-besar', gallery: ['my-besar', 'my-besar2', 'my-afterglow'],
    tagline: 'La grande y serena',
    description: 'Playas largas, muelles de madera y resorts sencillos con un ritmo más lento. Turtle Beach y sus senderos invitan a perderse un día entero.',
    scores: { snorkeling: 5, diving: 4, beach: 5, adventure: 3, nightlife: 1, peace: 5, hopping: 4 },
    duration: '1 día, o base alternativa', access: 'Taxi-barco desde Kecil, o lancha desde Kuala Besut.',
    stay: 'Vale tanto de excursión como de alojamiento más tranquilo.',
    season: 'En plena temporada en mayo. Muchos alojamientos cierran de noviembre a febrero.',
  },
  {
    id: 'redang', name: 'Pulau Redang', country: 'malaysia', image: 'my-redang', gallery: ['my-redang', 'my-redang2'],
    tagline: 'La playa de catálogo',
    description: 'Parque marino con arena blanquísima en Pasir Panjang. Es más de resort con paquete de excursiones y comidas que de mochila.',
    scores: { snorkeling: 5, diving: 4, beach: 5, adventure: 2, nightlife: 1, peace: 3, hopping: 2 },
    duration: '3 noches', access: 'Barco desde Merang o Kuala Terengganu. También ha tenido vuelos estacionales.',
    stay: 'Pernoctar: es la alternativa a las Perhentian, no un añadido.',
    season: 'Buena en mayo. Cerrada en la práctica durante el monzón.',
  },
  {
    id: 'langtengah', name: 'Lang Tengah', country: 'malaysia', image: 'my-langtengah', gallery: ['my-langtengah', 'my-langtengah2'],
    tagline: 'El secreto discreto',
    description: 'Isla diminuta, sin pueblos, con pocos resorts y agua turquesa. Ideal para desconectar, pero con muy poca flexibilidad para moverse.',
    scores: { snorkeling: 4, diving: 3, beach: 5, adventure: 2, nightlife: 1, peace: 5, hopping: 1 },
    duration: '2–3 noches', access: 'Barco contratado con el resort desde Merang.',
    stay: 'Pernoctar: solo tiene sentido en resort.',
    season: 'Buena en mayo. Cerrada en la práctica durante el monzón.',
  },
]

export const rankIslands = (key: IslandScoreKey | null) =>
  key === null ? ISLANDS : [...ISLANDS].sort((a, b) => b.scores[key] - a.scores[key])
