import type { Country } from './types'

export interface ComparisonCategory {
  id: string
  label: string
  /** Editorial 0–10 scores. `null` means the value is computed from the selected month. */
  scores: Record<Country, number> | null
  winnerNote: string
  detail: Record<Country, string>
}

export const COMPARISON: ComparisonCategory[] = [
  {
    id: 'beaches', label: 'Playas tropicales', scores: { thailand: 8.5, malaysia: 8.5 },
    winnerNote: 'Empate técnico: dependen más de la isla concreta que del país.',
    detail: { thailand: 'Más variedad de playas y más servicios, también más gente en las famosas.', malaysia: 'Las Perhentian y Redang tienen arena clarísima y agua transparente, con menos infraestructura.' },
  },
  {
    id: 'hopping', label: 'Island hopping', scores: { thailand: 9, malaysia: 7 },
    winnerNote: 'Tailandia tiene más islas conectadas entre sí.',
    detail: { thailand: 'Samui, Phangan y Tao se enlazan por ferry, con Ang Thong y Nang Yuan como excursiones.', malaysia: 'Las Perhentian se recorren muy bien, pero saltar a Redang o Lang Tengah exige planificar.' },
  },
  {
    id: 'snorkel', label: 'Snórkel y buceo', scores: { thailand: 8, malaysia: 8.5 },
    winnerNote: 'Muy igualado; las Perhentian se llevan el snórkel desde la orilla.',
    detail: { thailand: 'Koh Tao es uno de los grandes centros de formación de buceo de la región.', malaysia: 'Arrecifes accesibles y opciones de ver tortugas, sin que esté garantizado.' },
  },
  {
    id: 'nature', label: 'Naturaleza y fauna', scores: { thailand: 8, malaysia: 8.5 },
    winnerNote: 'Malasia gana algo por sus selvas y tierras altas.',
    detail: { thailand: 'Montañas del norte y el paisaje marino de Ang Thong.', malaysia: 'Cameron Highlands, selvas antiguas y, con más tiempo, Borneo.' },
  },
  {
    id: 'cities', label: 'Ciudades', scores: { thailand: 9, malaysia: 8 },
    winnerNote: 'Bangkok es difícil de igualar, aunque Penang es una joya.',
    detail: { thailand: 'Bangkok y Chiang Mai, dos caras muy distintas.', malaysia: 'Kuala Lumpur moderna y una George Town con mucho encanto.' },
  },
  {
    id: 'culture', label: 'Cultura y monumentos', scores: { thailand: 9.5, malaysia: 8 },
    winnerNote: 'Tailandia es más monumental; Malasia, más mestiza.',
    detail: { thailand: 'Gran Palacio, Ayutthaya y los templos lanna de Chiang Mai.', malaysia: 'Convivencia de mezquitas, templos hindúes y chinos en un mismo paseo.' },
  },
  {
    id: 'food', label: 'Gastronomía', scores: { thailand: 9.5, malaysia: 9.5 },
    winnerNote: 'Empate: es cuestión de gustos, no de calidad.',
    detail: { thailand: 'Sabores intensos y comida callejera en todas partes.', malaysia: 'Cocinas malaya, china e india, con Penang como referencia.' },
  },
  {
    id: 'nightlife', label: 'Vida nocturna', scores: { thailand: 9.5, malaysia: 5.5 },
    winnerNote: 'Es la diferencia más clara entre los dos países.',
    detail: { thailand: 'Bangkok, Haad Rin y Sairee: abundante y fácil de encontrar.', malaysia: 'Hay bares en Kuala Lumpur y Penang, pero las Perhentian son muy tranquilas y el alcohol es limitado.' },
  },
  {
    id: 'island-ease', label: 'Facilidad entre islas', scores: { thailand: 8.5, malaysia: 6.5 },
    winnerNote: 'En el Golfo los ferris están más rodados.',
    detail: { thailand: 'Red de ferris muy turística y frecuente, con billetes combinados.', malaysia: 'Llegar a la costa este desde Penang consume un día y todo depende de una única lancha.' },
  },
  {
    id: 'budget', label: 'Presupuesto', scores: { thailand: 7.5, malaysia: 8 },
    winnerNote: 'Malasia sale algo más barata en la estimación ilustrativa.',
    detail: { thailand: 'Más vuelos internos y excursiones de barco elevan el total.', malaysia: 'Menos vuelos internos, pero el alcohol es caro y los vuelos internacionales pesan igual.' },
  },
  {
    id: 'season', label: 'Encaje con el mes elegido', scores: null,
    winnerNote: 'Calculado a partir del mes seleccionado en la sección de clima.',
    detail: { thailand: 'En mayo, el Golfo suele ser la opción más sensata; el Andamán empeora.', malaysia: 'En mayo, las islas de la costa este están en plena temporada.' },
  },
  {
    id: 'philippines', label: 'Parecido con Filipinas', scores: { thailand: 8.5, malaysia: 7.5 },
    winnerNote: 'Ang Thong es lo que más recuerda a Palawan.',
    detail: { thailand: 'Islas calizas, excursiones en barco y sensación de ruta entre islas.', malaysia: 'Muy parecido en playa y snórkel, menos en paisaje kárstico y en saltar entre islas.' },
  },
]

export type Criterion =
  | 'beaches' | 'hopping' | 'snorkel' | 'nature' | 'culture' | 'nightlife' | 'budget' | 'transport'

export const CRITERIA: Array<{ id: Criterion; label: string; short: string }> = [
  { id: 'beaches', label: 'Playas', short: 'las playas' },
  { id: 'hopping', label: 'Island hopping', short: 'saltar de isla en isla' },
  { id: 'snorkel', label: 'Snórkel', short: 'el snórkel' },
  { id: 'nature', label: 'Naturaleza', short: 'la naturaleza' },
  { id: 'culture', label: 'Ciudades y templos', short: 'las ciudades y los templos' },
  { id: 'nightlife', label: 'Vida nocturna', short: 'la vida nocturna' },
  { id: 'budget', label: 'Presupuesto', short: 'el presupuesto' },
  { id: 'transport', label: 'Comodidad de transporte', short: 'la comodidad de los traslados' },
]

/** Editorial 0–100 affinity of each country with each criterion. */
export const COUNTRY_PROFILES: Record<Country, Record<Criterion, number>> = {
  thailand: { beaches: 85, hopping: 90, snorkel: 80, nature: 80, culture: 93, nightlife: 95, budget: 75, transport: 85 },
  malaysia: { beaches: 85, hopping: 70, snorkel: 85, nature: 85, culture: 80, nightlife: 55, budget: 80, transport: 65 },
}
