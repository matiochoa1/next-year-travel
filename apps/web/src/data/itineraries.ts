import type { TransportMode } from './routes'
import type { Country } from './types'

export type TravelStyle = 'relaxed' | 'balanced' | 'adventurous'
export type TripDuration = 14 | 15 | 16

export const DURATIONS: TripDuration[] = [14, 15, 16]

export const STYLE_LABELS: Record<TravelStyle, string> = {
  relaxed: 'Relajado',
  balanced: 'Equilibrado',
  adventurous: 'Aventurero',
}

export interface DayPlan {
  id: string
  place: string
  destination: string
  title: string
  activities: string[]
  experiences: string[]
  /** Null when the night is spent on a plane. */
  base: string | null
  transport: { mode: TransportMode; text: string } | null
  alternatives: string[]
  /** 1 (very calm) to 5 (very demanding). */
  intensity: 1 | 2 | 3 | 4 | 5
  image: string
  warning?: string
  styleNotes?: Partial<Record<TravelStyle, string>>
  /** Omitted from the 14-day version. */
  skipIn14?: boolean
  /** Only part of the 16-day version. */
  onlyIn16?: boolean
}

export const ITINERARY_PLANS: Record<Country, DayPlan[]> = {
  thailand: [
    {
      id: 'th-depart', place: 'bangkok', destination: 'Madrid → Bangkok', title: 'Salida desde Madrid',
      activities: ['Vuelo de larga distancia, normalmente con una escala en Oriente Medio o Europa.'],
      experiences: ['Dormir lo que se pueda: mañana toca aguantar hasta la noche'],
      base: null, transport: { mode: 'flight', text: 'Madrid → Bangkok. Horarios y escala por confirmar al reservar.' },
      alternatives: ['Si el vuelo sale de madrugada, se puede ganar media tarde en Bangkok.'],
      intensity: 2, image: 'th-longtail',
    },
    {
      id: 'th-arrival', place: 'bangkok', destination: 'Bangkok', title: 'Llegada y Chinatown',
      activities: ['Traslado al hotel y descanso.', 'Paseo al atardecer por Yaowarat.', 'Primera cena callejera.'],
      experiences: ['Puestos de comida de Yaowarat', 'Barco por el Chao Phraya al atardecer'],
      base: 'Bangkok (zona del río o Silom)', transport: { mode: 'road', text: 'Del aeropuerto al centro en taxi o tren.' },
      alternatives: ['Masaje tailandés y cena tranquila si el vuelo ha sido duro.'],
      intensity: 2, image: 'th-yaowarat',
    },
    {
      id: 'th-temples', place: 'bangkok', destination: 'Bangkok', title: 'Templos y gran palacio',
      activities: ['Gran Palacio y Wat Phra Kaew a primera hora.', 'Wat Pho y su Buda reclinado.', 'Cruce en barca hasta Wat Arun.', 'Azotea o mercado nocturno.'],
      experiences: ['Wat Phra Kaew', 'Wat Arun al caer el sol'],
      base: 'Bangkok', transport: { mode: 'boat', text: 'Barcos públicos por el río y metro.' },
      alternatives: ['Mercado flotante por la mañana, o barrio de Ari para cafés y comida local.'],
      intensity: 4, image: 'th-grandpalace',
      styleNotes: { relaxed: 'Dejad Wat Pho para el día siguiente y parad a comer con calma: en mayo el calor pesa.' },
    },
    {
      id: 'th-ayutthaya', place: 'ayutthaya', destination: 'Ayutthaya', title: 'Excursión a Ayutthaya',
      activities: ['Tren o furgoneta temprano.', 'Ruinas en bici, tuk-tuk o barca.', 'Atardecer en Wat Chaiwatthanaram.', 'Vuelta a Bangkok.'],
      experiences: ['Parque histórico de Ayutthaya', 'Cabeza de Buda entre raíces en Wat Mahathat'],
      base: 'Bangkok', transport: { mode: 'rail', text: 'Tren o furgoneta, ida y vuelta en el día.' },
      alternatives: ['Quedarse en Bangkok con Jim Thompson House y el barrio de Thonburi.'],
      intensity: 3, image: 'th-ayutthaya2',
    },
    {
      id: 'th-to-cm', place: 'chiangmai', destination: 'Chiang Mai', title: 'Rumbo al norte',
      activities: ['Vuelo por la mañana.', 'Tarde por el casco antiguo.', 'Wat Phra Singh y Wat Chedi Luang.', 'Mercado nocturno.'],
      experiences: ['Casco antiguo amurallado', 'Khao soi, el plato del norte'],
      base: 'Chiang Mai (casco antiguo)', transport: { mode: 'flight', text: 'Vuelo doméstico Bangkok → Chiang Mai.' },
      alternatives: ['Tren nocturno desde Bangkok si se quiere la experiencia, a cambio de una noche peor.'],
      intensity: 3, image: 'th-chedi',
    },
    {
      id: 'th-cm-nature', place: 'chiangmai', destination: 'Chiang Mai', title: 'Doi Suthep y naturaleza',
      activities: ['Subida a Wat Phra That Doi Suthep.', 'Cascadas o rutas por la montaña.', 'Clase de cocina o masaje.'],
      experiences: ['Vistas desde Doi Suthep', 'Santuario de elefantes que no ofrezca montas ni espectáculos'],
      base: 'Chiang Mai', transport: { mode: 'road', text: 'Songthaew o coche con conductor.' },
      alternatives: ['Clase de cocina tailandesa.', 'Mercados de Nimman y Warorot.'],
      intensity: 3, image: 'th-doisuthep',
      styleNotes: { adventurous: 'Sumad rafting o una ruta de un día por la selva si el nivel del agua lo permite.' },
    },
    {
      id: 'th-inthanon', place: 'chiangmai', destination: 'Doi Inthanon', title: 'Día extra en las montañas',
      activities: ['Excursión al parque nacional Doi Inthanon, la cima de Tailandia.', 'Sendero corto y cascadas.', 'Vuelta a Chiang Mai.'],
      experiences: ['Bosque de altura', 'Pagodas gemelas del parque'],
      base: 'Chiang Mai', transport: { mode: 'road', text: 'Coche con conductor, día completo.' },
      alternatives: ['Pai no compensa en un solo día: mejor no intentarlo.'],
      intensity: 3, image: 'th-elephant', onlyIn16: true,
    },
    {
      id: 'th-to-samui', place: 'samui', destination: 'Koh Samui', title: 'Del norte al Golfo',
      activities: ['Vuelo a Samui.', 'Registro en el hotel.', 'Primer baño y atardecer.'],
      experiences: ['Primer contacto con el Golfo', 'Fisherman’s Village'],
      base: 'Koh Samui (Bophut o Lamai)', transport: { mode: 'flight', text: 'Chiang Mai → Samui, directo si hay temporada; si no, por Bangkok.' },
      alternatives: ['Volar a Surat Thani y cruzar en ferry si el vuelo a Samui se dispara de precio.'],
      intensity: 3, image: 'th-samui',
      warning: 'Conexión ajustada: si no hay vuelo directo, el día se va en aeropuertos.',
    },
    {
      id: 'th-angthong', place: 'angthong', destination: 'Parque Marino de Ang Thong', title: 'Excursión a Ang Thong',
      activities: ['Barco temprano hacia el archipiélago.', 'Subida al mirador de Ko Wua Ta Lap.', 'Laguna esmeralda de Ko Mae Ko.', 'Kayak y snórkel.'],
      experiences: ['El paisaje más “Filipinas” de la ruta', 'Kayak entre islas calizas'],
      base: 'Koh Samui', transport: { mode: 'boat', text: 'Excursión organizada, sujeta al estado del mar.' },
      alternatives: ['Si el mar está mal, cambiarla de día o sustituirla por el interior de Samui.'],
      intensity: 4, image: 'th-angthong',
    },
    {
      id: 'th-to-phangan', place: 'phangan', destination: 'Koh Phangan', title: 'Ferry a Koh Phangan',
      activities: ['Ferry corto entre islas.', 'Moto o taxi al alojamiento.', 'Tarde de playa en el norte o el oeste.'],
      experiences: ['Atardecer en la costa oeste', 'Mercado de Thong Sala'],
      base: 'Koh Phangan', transport: { mode: 'ferry', text: 'Ferry o catamarán Samui → Phangan.' },
      alternatives: ['Alojarse en Thong Sala si se prefiere moverse sin moto.'],
      intensity: 2, image: 'th-phangan3',
    },
    {
      id: 'th-phangan', place: 'phangan', destination: 'Koh Phangan', title: 'Playas y miradores',
      activities: ['Barca o ruta hacia Bottle Beach.', 'Cascadas del interior.', 'Mirador al atardecer.'],
      experiences: ['Bottle Beach', 'Fiestas en Haad Rin si coinciden con las fechas'],
      base: 'Koh Phangan', transport: { mode: 'boat', text: 'Barca de cola larga o taxi 4x4.' },
      alternatives: ['Comprobad el calendario lunar: la Full Moon Party cambia de fecha y dispara los precios.'],
      intensity: 3, image: 'th-phangan2', skipIn14: true,
      styleNotes: { adventurous: 'Haced a pie el sendero costero hasta Bottle Beach, con agua y calzado adecuado.' },
    },
    {
      id: 'th-to-tao', place: 'tao', destination: 'Koh Tao', title: 'Catamarán a Koh Tao',
      activities: ['Catamarán por la mañana.', 'Instalación en Sairee o el sur.', 'Atardecer en la playa.'],
      experiences: ['Atardecer en Sairee', 'Cena junto al mar'],
      base: 'Koh Tao', transport: { mode: 'ferry', text: 'Catamarán Phangan → Tao, sensible al mar.' },
      alternatives: ['Quedarse en el sur de la isla para estar más tranquilos.'],
      intensity: 2, image: 'th-tao2',
    },
    {
      id: 'th-nangyuan', place: 'nangyuan', destination: 'Koh Tao y Koh Nang Yuan', title: 'Koh Nang Yuan',
      activities: ['Barca temprano para evitar a la gente.', 'Subida al mirador.', 'Snórkel en la lengua de arena.', 'Tarde en la bahía de Tanote.'],
      experiences: ['La vista icónica de Nang Yuan', 'Snórkel en Japanese Gardens'],
      base: 'Koh Tao', transport: { mode: 'boat', text: 'Taxi-barco desde Koh Tao. Se paga entrada a la isla.' },
      alternatives: ['Vuelta a la isla en barco con paradas de snórkel.'],
      intensity: 3, image: 'th-nangyuan',
    },
    {
      id: 'th-dive', place: 'tao', destination: 'Koh Tao', title: 'Snórkel y buceo',
      activities: ['Bautismo de buceo o inmersiones.', 'Snórkel en Shark Bay y Aow Leuk.', 'Último atardecer.'],
      experiences: ['Bautismo de buceo', 'Mirador John-Suwan'],
      base: 'Koh Tao', transport: null,
      alternatives: ['Día de playa sin planes, muy recomendable antes de volver.'],
      intensity: 3, image: 'th-tao',
      styleNotes: { adventurous: 'Hay quien se saca aquí una titulación de buceo, pero son varios días: habría que reservar antes.', relaxed: 'Sin despertador: hamaca, snórkel desde la playa y nada más.' },
    },
    {
      id: 'th-return', place: 'bangkok', destination: 'Koh Tao → Bangkok', title: 'Vuelta a Bangkok',
      activities: ['Ferry o catamarán de salida.', 'Vuelo a Bangkok.', 'Última cena en la ciudad.'],
      experiences: ['Última compra de recuerdos'],
      base: 'Bangkok (cerca del aeropuerto)', transport: { mode: 'ferry', text: 'Tao → Samui en barco y vuelo a Bangkok, o barco y autobús vía Chumphon.' },
      alternatives: ['Según los horarios, se puede enlazar directamente con el vuelo internacional.'],
      intensity: 4, image: 'th-bangkok-river',
      warning: 'Conexión ajustada: el mar puede retrasar el barco. No conviene enlazar el mismo día con un vuelo internacional.',
    },
    {
      id: 'th-home', place: 'bangkok', destination: 'Bangkok → Madrid', title: 'Regreso a Madrid',
      activities: ['Traslado al aeropuerto y vuelo de vuelta.'],
      experiences: ['Empezar a planear el siguiente viaje'],
      base: null, transport: { mode: 'flight', text: 'Bangkok → Madrid. Según el horario, se aterriza ese mismo día o a la mañana siguiente.' },
      alternatives: [],
      intensity: 2, image: 'th-watarun',
    },
  ],
  malaysia: [
    {
      id: 'my-depart', place: 'kl', destination: 'Madrid → Kuala Lumpur', title: 'Salida desde Madrid',
      activities: ['Vuelo de larga distancia con al menos una escala.'],
      experiences: ['Dormir lo que se pueda'],
      base: null, transport: { mode: 'flight', text: 'Madrid → Kuala Lumpur. Horarios y escala por confirmar al reservar.' },
      alternatives: [],
      intensity: 2, image: 'my-klskyline',
    },
    {
      id: 'my-arrival', place: 'kl', destination: 'Kuala Lumpur', title: 'Llegada a la capital',
      activities: ['Traslado al centro.', 'Paseo por el parque KLCC.', 'Torres Petronas iluminadas.', 'Cena en Jalan Alor.'],
      experiences: ['Torres Petronas de noche', 'Jalan Alor'],
      base: 'Kuala Lumpur (Bukit Bintang)', transport: { mode: 'rail', text: 'Tren exprés o taxi desde el aeropuerto.' },
      alternatives: ['Cena tranquila en el barrio si el vuelo ha sido duro.'],
      intensity: 2, image: 'my-petronas',
    },
    {
      id: 'my-batu', place: 'batu', destination: 'Batu Caves y Kuala Lumpur', title: 'Batu Caves y ciudad',
      activities: ['Temprano a Batu Caves, antes del calor.', 'Subida a los 272 escalones.', 'Tarde en Merdeka Square y Chinatown.', 'Cena en Little India.'],
      experiences: ['Escalinata de colores de Batu Caves', 'Plaza Merdeka'],
      base: 'Kuala Lumpur', transport: { mode: 'rail', text: 'Tren de cercanías desde KL Sentral.' },
      alternatives: ['Coche con conductor si se quiere llegar antes.'],
      intensity: 3, image: 'my-batu',
    },
    {
      id: 'my-kl-culture', place: 'kl', destination: 'Kuala Lumpur', title: 'Cultura y comida',
      activities: ['Mezquita Nacional o Museo de Arte Islámico.', 'Barrio de Kampung Baru.', 'Ruta gastronómica.', 'Azotea con vistas.'],
      experiences: ['Museo de Arte Islámico', 'Ruta de comida malaya, china e india'],
      base: 'Kuala Lumpur', transport: { mode: 'rail', text: 'Metro y a pie.' },
      alternatives: ['Excursión a Melaka de un día, larga pero posible.'],
      intensity: 3, image: 'my-merdeka', skipIn14: true,
    },
    {
      id: 'my-to-cameron', place: 'cameron', destination: 'Cameron Highlands', title: 'Subida a las tierras altas',
      activities: ['Autobús o coche por carretera de montaña.', 'Paseo por Tanah Rata.', 'Primera tarde fresca.'],
      experiences: ['Cambio de clima al subir', 'Scones con té local'],
      base: 'Tanah Rata', transport: { mode: 'road', text: 'Autobús o coche. Las curvas pueden marear.' },
      alternatives: ['Parar en Ipoh a comer de camino si se va en coche.'],
      intensity: 2, image: 'my-cameron2',
    },
    {
      id: 'my-cameron', place: 'cameron', destination: 'Cameron Highlands', title: 'Té y bosque nublado',
      activities: ['Plantaciones de té BOH por la mañana.', 'Mossy Forest con guía.', 'Caminata por los senderos de Tanah Rata.'],
      experiences: ['Mar verde de té', 'Bosque musgoso entre niebla'],
      base: 'Tanah Rata', transport: { mode: 'road', text: 'Excursión en 4x4 o taxi local.' },
      alternatives: ['Granjas de fresas y mercados si llueve.'],
      intensity: 3, image: 'my-mossy',
      styleNotes: { adventurous: 'Sumad la subida a Gunung Brinchang con guía si el terreno está en buen estado.' },
    },
    {
      id: 'my-to-penang', place: 'penang', destination: 'George Town, Penang', title: 'Bajada a Penang',
      activities: ['Furgoneta hacia la costa.', 'Cruce por el puente de Penang.', 'Primer paseo y cena en un hawker.'],
      experiences: ['Primer hawker center de Penang'],
      base: 'George Town', transport: { mode: 'road', text: 'Furgoneta o coche hasta la isla por el puente.' },
      alternatives: ['Parada en Ipoh si se va en coche.'],
      intensity: 2, image: 'my-georgetown',
    },
    {
      id: 'my-penang', place: 'penang', destination: 'George Town, Penang', title: 'George Town a fondo',
      activities: ['Casco histórico y arte urbano.', 'Muelles de los clanes.', 'Casas de clan y templos.', 'Ruta gastronómica.'],
      experiences: ['Chew Jetty', 'Char kway teow y assam laksa'],
      base: 'George Town', transport: null,
      alternatives: ['Alquilar bicis para recorrer el casco.'],
      intensity: 3, image: 'my-streetart',
    },
    {
      id: 'my-penang2', place: 'penang', destination: 'Penang', title: 'Día extra en la isla',
      activities: ['Templo Kek Lok Si.', 'Funicular a Penang Hill.', 'Parque nacional de Penang si hay energía.'],
      experiences: ['Kek Lok Si', 'Vistas desde Penang Hill'],
      base: 'George Town', transport: { mode: 'road', text: 'Autobús urbano o coche.' },
      alternatives: ['Otro día de comer sin remordimientos.'],
      intensity: 3, image: 'my-keklok', onlyIn16: true,
    },
    {
      id: 'my-to-kb', place: 'kotabharu', destination: 'Kota Bharu / Kuala Besut', title: 'Cruzar la península',
      activities: ['Vuelo si hay plazas, o largo trayecto por carretera.', 'Mercado Siti Khadijah si da tiempo.', 'Noche cerca del embarcadero.'],
      experiences: ['La carretera este-oeste, entre selva', 'Mercado central de Kota Bharu'],
      base: 'Kota Bharu o Kuala Besut', transport: { mode: 'road', text: 'Por carretera es un día completo; comprobad si hay vuelo ese día.' },
      alternatives: ['Volar vía Kuala Lumpur si no hay vuelo directo.'],
      intensity: 4, image: 'my-kotabharu',
      warning: 'Día de transporte largo: es el mayor punto débil de esta ruta.',
    },
    {
      id: 'my-to-perhentian', place: 'kecil', destination: 'Perhentian Kecil', title: 'Lancha a las Perhentian',
      activities: ['Traslado a Kuala Besut.', 'Lancha rápida a la isla.', 'Primera tarde en la arena.'],
      experiences: ['Long Beach o Coral Bay', 'Atardecer en Coral Bay'],
      base: 'Perhentian Kecil', transport: { mode: 'boat', text: 'Lancha rápida desde Kuala Besut, según el mar. Se paga tasa del parque marino.' },
      alternatives: ['Alojarse en Perhentian Besar si se prefiere más calma.'],
      intensity: 3, image: 'my-kecil',
      warning: 'Llevad efectivo: en las islas no conviene contar con cajeros ni pago con tarjeta.',
    },
    {
      id: 'my-snorkel', place: 'kecil', destination: 'Islas Perhentian', title: 'Snórkel y playas',
      activities: ['Excursión de snórkel por varios puntos.', 'Tiempo en playas de Besar.', 'Atardecer.'],
      experiences: ['Snórkel en arrecifes', 'Posibilidad de ver tortugas y tiburones de arrecife, sin garantía'],
      base: 'Perhentian Kecil', transport: { mode: 'boat', text: 'Barco de excursión o taxi-barco.' },
      alternatives: ['Kayak hasta las calas vecinas.'],
      intensity: 3, image: 'my-perhentian',
    },
    {
      id: 'my-hopping', place: 'besar', destination: 'Perhentian Besar', title: 'Isla a isla',
      activities: ['Cruce a Perhentian Besar.', 'Ruta por varias playas en taxi-barco.', 'Sendero entre playas.'],
      experiences: ['Turtle Beach', 'Senderos a través de la selva'],
      base: 'Perhentian Kecil o Besar', transport: { mode: 'boat', text: 'Taxi-barco entre playas.' },
      alternatives: ['Excursión a Rawa o Susu Dara en barco si se contrata.'],
      intensity: 3, image: 'my-besar',
    },
    {
      id: 'my-relax', place: 'kecil', destination: 'Islas Perhentian', title: 'Playa y buceo opcional',
      activities: ['Día sin horarios.', 'Bautismo de buceo opcional.', 'Último atardecer.'],
      experiences: ['Sugar Wreck para quien bucee', 'Hamaca sin remordimientos'],
      base: 'Perhentian Kecil', transport: null,
      alternatives: ['Paseo hasta el mirador del faro.'],
      intensity: 2, image: 'my-afterglow',
      styleNotes: { adventurous: 'Dos inmersiones por la mañana y kayak por la tarde.', relaxed: 'Reservad un día entero a la sombra de las palmeras.' },
    },
    {
      id: 'my-return', place: 'kl', destination: 'Perhentian → Kuala Lumpur', title: 'Vuelta a Kuala Lumpur',
      activities: ['Lancha de la mañana a Kuala Besut.', 'Traslado a Kota Bharu.', 'Vuelo a Kuala Lumpur.'],
      experiences: ['Última cena en Kuala Lumpur'],
      base: 'Kuala Lumpur (cerca de KL Sentral)', transport: { mode: 'boat', text: 'Lancha, taxi a Kota Bharu y vuelo doméstico.' },
      alternatives: ['Dormir cerca del aeropuerto si el vuelo a Madrid sale temprano.'],
      intensity: 4, image: 'my-besar2',
      warning: 'Conexión ajustada: lancha, taxi y vuelo el mismo día. Mejor no enlazar con el vuelo internacional.',
    },
    {
      id: 'my-home', place: 'kl', destination: 'Kuala Lumpur → Madrid', title: 'Regreso a Madrid',
      activities: ['Traslado al aeropuerto y vuelo de vuelta.'],
      experiences: ['Empezar a planear el siguiente viaje'],
      base: null, transport: { mode: 'flight', text: 'Kuala Lumpur → Madrid. Según el horario, se aterriza ese mismo día o a la mañana siguiente.' },
      alternatives: [],
      intensity: 2, image: 'my-klskyline',
    },
  ],
}
