import type { Country } from './types'

export type Rating = 1 | 2 | 3 | 4 | 5

export const RATING_LABELS: Record<Rating, string> = {
  1: 'Evitar',
  2: 'Desfavorable',
  3: 'Aceptable',
  4: 'Buena',
  5: 'Muy buena',
}

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

export const MAY = 4

export type RegionId =
  | 'bangkok' | 'chiangmai' | 'gulf' | 'andaman'
  | 'kl' | 'cameron' | 'penang' | 'eastcoast' | 'langkawi' | 'sabah'

export interface ClimateRegion {
  id: RegionId
  country: Country
  name: string
  scope: string
  /** Editorial rating by month, January first, based on historical climate patterns. */
  ratings: readonly [Rating, Rating, Rating, Rating, Rating, Rating, Rating, Rating, Rating, Rating, Rating, Rating]
  pattern: string
  mayNote: string
}

export const REGIONS: ClimateRegion[] = [
  {
    id: 'bangkok', country: 'thailand', name: 'Bangkok y centro', scope: 'Bangkok, Ayutthaya',
    ratings: [5, 5, 4, 3, 3, 3, 3, 3, 2, 2, 4, 5],
    pattern: 'Lo más agradable suele ser de noviembre a febrero. Abril y mayo son los meses más calurosos, y de junio a octubre llega la estación húmeda.',
    mayNote: 'Calor intenso y húmedo, con las primeras tormentas de tarde. Conviene madrugar para los templos.',
  },
  {
    id: 'chiangmai', country: 'thailand', name: 'Norte', scope: 'Chiang Mai',
    ratings: [5, 4, 2, 2, 3, 3, 3, 3, 2, 3, 5, 5],
    pattern: 'Noviembre a enero es la época más fresca. De febrero a abril suele haber bruma por quemas agrícolas, y la lluvia se instala desde mayo.',
    mayNote: 'Transición: la bruma de la temporada de quemas suele remitir y el verde empieza a volver, con chaparrones.',
  },
  {
    id: 'gulf', country: 'thailand', name: 'Islas del Golfo', scope: 'Koh Samui, Koh Phangan, Koh Tao, Ang Thong',
    ratings: [4, 5, 5, 5, 4, 4, 4, 4, 3, 2, 1, 2],
    pattern: 'Patrón distinto al del resto de Tailandia: la lluvia fuerte suele concentrarse de octubre a diciembre, con noviembre como peor mes.',
    mayNote: 'A menudo la mejor opción de playa en Tailandia en mayo. Hay chubascos, pero suele estar más protegida del monzón del suroeste que el Andamán.',
  },
  {
    id: 'andaman', country: 'thailand', name: 'Costa de Andamán', scope: 'Krabi, Railay, Phi Phi, Phuket, Koh Lanta',
    ratings: [5, 5, 5, 4, 2, 2, 2, 2, 1, 2, 4, 5],
    pattern: 'Generalmente favorable de noviembre a abril. El monzón del suroeste entra hacia mayo y trae mar de fondo hasta octubre.',
    mayNote: 'Empeora a lo largo del mes: más lluvia, mar más movido y posibles cancelaciones de barcos.',
  },
  {
    id: 'kl', country: 'malaysia', name: 'Kuala Lumpur', scope: 'Kuala Lumpur, Batu Caves',
    ratings: [4, 4, 3, 3, 3, 4, 4, 4, 3, 3, 2, 3],
    pattern: 'Ecuatorial: calor todo el año, con chaparrones de tarde. Suele llover algo más en torno a abril y de octubre a noviembre.',
    mayNote: 'Calor húmedo y tormentas tropicales puntuales, normalmente por la tarde.',
  },
  {
    id: 'cameron', country: 'malaysia', name: 'Cameron Highlands', scope: 'Tanah Rata, Brinchang',
    ratings: [4, 4, 3, 3, 3, 4, 4, 4, 3, 2, 2, 3],
    pattern: 'Temperaturas frescas por altitud durante todo el año. Las mañanas suelen ser más despejadas que las tardes.',
    mayNote: 'Agradable respiro térmico. Mejor concentrar las caminatas por la mañana y llevar capa de lluvia.',
  },
  {
    id: 'penang', country: 'malaysia', name: 'Penang', scope: 'George Town',
    ratings: [5, 5, 4, 3, 3, 4, 4, 3, 2, 2, 3, 4],
    pattern: 'Lo más seco suele ser de diciembre a febrero; septiembre y octubre tienden a ser los meses más lluviosos.',
    mayNote: 'Duchas tropicales posibles, sin que suelan arruinar un día de ciudad y comida.',
  },
  {
    id: 'eastcoast', country: 'malaysia', name: 'Islas de la costa este', scope: 'Perhentian, Redang, Lang Tengah',
    ratings: [1, 1, 4, 5, 5, 5, 5, 4, 4, 3, 1, 1],
    pattern: 'Generalmente favorable de marzo a octubre. El monzón del noreste golpea de noviembre a febrero y gran parte de los alojamientos cierra.',
    mayNote: 'Uno de sus mejores momentos: temporada abierta y mar habitualmente tranquilo. Es el punto más fuerte de Malasia para este viaje.',
  },
  {
    id: 'langkawi', country: 'malaysia', name: 'Langkawi', scope: 'Pantai Cenang, Kilim',
    ratings: [5, 5, 5, 3, 3, 3, 3, 3, 2, 2, 3, 4],
    pattern: 'Sigue un patrón del lado oeste, opuesto a la costa este: lo mejor suele ser de diciembre a marzo y lo peor en septiembre y octubre.',
    mayNote: 'Entra en temporada baja: más lluvia y mar menos fiable. Posible, pero no su mejor momento.',
  },
  {
    id: 'sabah', country: 'malaysia', name: 'Sabah (Borneo)', scope: 'Semporna, Sipadan',
    ratings: [3, 3, 4, 5, 5, 5, 5, 4, 4, 4, 3, 3],
    pattern: 'Semporna queda bastante protegida de los monzones y se bucea todo el año, con mejores condiciones habituales de abril a septiembre.',
    mayNote: 'Buen momento para bucear, pero requiere vuelos internos adicionales y otro tipo de viaje.',
  },
]

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r])) as Record<RegionId, ClimateRegion>
