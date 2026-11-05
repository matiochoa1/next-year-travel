import type { Country } from './types'

export interface ExplorerTopic {
  id: string
  title: string
  lead: string
  body: string
  highlights: string[]
  image: string
}

export interface DestinationProfile {
  name: string
  kicker: string
  overview: string
  heroImage: string
  gallery: string[]
  signature: Array<{ title: string; text: string }>
  cities: Array<{ name: string; text: string }>
  topics: ExplorerTopic[]
  advantages: string[]
  tradeoffs: string[]
  may: { verdict: string; text: string }
}

export const DESTINATIONS: Record<Country, DestinationProfile> = {
  thailand: {
    name: 'Tailandia',
    kicker: 'El clásico que nunca decepciona',
    overview:
      'Tailandia lo tiene casi todo a un vuelo corto de distancia: una capital desbordante, templos milenarios, montañas en el norte y un rosario de islas en el Golfo. Es el destino más fácil de los dos y el que más variedad ofrece para un grupo con gustos distintos.',
    heroImage: 'th-angthong3',
    gallery: ['th-grandpalace', 'th-angthong', 'th-yaowarat', 'th-ayutthaya', 'th-nangyuan', 'th-phangan2', 'th-chedi', 'th-padthai'],
    signature: [
      { title: 'Ang Thong en barco', text: 'Un día entre islas calizas, kayak y un mirador de los que no se olvidan.' },
      { title: 'Atardecer en Ayutthaya', text: 'Ruinas de ladrillo de la antigua capital de Siam, teñidas de naranja.' },
      { title: 'Bucear en Koh Tao', text: 'Uno de los lugares más populares del mundo para iniciarse en el buceo.' },
      { title: 'Noche en Yaowarat', text: 'Neones, woks y humo en el barrio chino de Bangkok.' },
    ],
    cities: [
      { name: 'Bangkok', text: 'Caótica y fascinante: templos dorados, barcos por el río, azoteas y una oferta de comida inagotable.' },
      { name: 'Chiang Mai', text: 'Más pausada, con un casco antiguo amurallado lleno de templos y las montañas a un paso.' },
    ],
    topics: [
      {
        id: 'culture', title: 'Cultura y templos', lead: 'El capítulo más monumental del viaje.',
        body: 'El budismo está presente en la vida diaria. En Bangkok destacan el Gran Palacio y Wat Arun; en Ayutthaya, las ruinas de una antigua capital; y en Chiang Mai, los templos de estilo lanna. Hay que llevar hombros y rodillas cubiertos.',
        highlights: ['Wat Phra Kaew', 'Parque histórico de Ayutthaya', 'Wat Phra That Doi Suthep'],
        image: 'th-ayutthaya2',
      },
      {
        id: 'beaches', title: 'Playas tropicales', lead: 'Del ambiente de Samui a las calas escondidas de Phangan.',
        body: 'En mayo, el foco está en el Golfo: Chaweng y Bophut en Samui, Bottle Beach y Thong Nai Pan en Phangan, y Sairee en Koh Tao. La arena es clara y el agua cálida, aunque algunas zonas se quedan poco profundas con la marea baja.',
        highlights: ['Bottle Beach', 'Sairee', 'Thong Nai Pan'],
        image: 'th-phangan',
      },
      {
        id: 'nature', title: 'Parques y naturaleza', lead: 'Selva de montaña al norte, parque marino al sur.',
        body: 'El Parque Marino de Ang Thong es el gran protagonista por sus islas calizas, sus lagunas y sus miradores. En el norte, Doi Suthep y Doi Inthanon ofrecen bosque de altura. Quien quiera ver elefantes debería elegir santuarios sin montas ni espectáculos.',
        highlights: ['Ang Thong', 'Doi Inthanon', 'Doi Suthep-Pui'],
        image: 'th-angthong2',
      },
      {
        id: 'food', title: 'Gastronomía', lead: 'Una razón para ir por sí sola.',
        body: 'Pad thai, som tam, curry massaman, mango sticky rice y el khao soi del norte. Se come muy bien en la calle y por poco dinero. Si hay alergias o intolerancias, conviene aprender a explicarlas: el marisco y los cacahuetes están por todas partes.',
        highlights: ['Khao soi en Chiang Mai', 'Mercado de Thong Sala', 'Puestos de Yaowarat'],
        image: 'th-padthai',
      },
      {
        id: 'nightlife', title: 'Vida nocturna', lead: 'Aquí Tailandia juega en otra liga.',
        body: 'Bangkok tiene azoteas y barrios de bares para todos los gustos. Koh Phangan es famosa por sus fiestas en Haad Rin, y Sairee, en Koh Tao, tiene un ambiente animado. Las fechas de las fiestas de luna llena cambian cada mes: si nos interesan, hay que cuadrarlas antes de reservar.',
        highlights: ['Azoteas de Bangkok', 'Haad Rin', 'Sairee de noche'],
        image: 'th-yaowarat',
      },
      {
        id: 'hopping', title: 'Island hopping', lead: 'Una cadena natural de norte a sur.',
        body: 'Samui, Phangan y Tao están enlazadas por ferris y catamaranes, y desde ellas salen las excursiones a Ang Thong y Nang Yuan. Es lo más parecido a saltar de isla en isla sin tener que organizar barcos privados.',
        highlights: ['Samui → Phangan → Tao', 'Excursión a Ang Thong', 'Lengua de arena de Nang Yuan'],
        image: 'th-nangyuan2',
      },
    ],
    advantages: [
      'Variedad enorme en un solo viaje.',
      'Red turística muy rodada, con ferris y vuelos frecuentes.',
      'La mejor vida nocturna de las dos opciones.',
      'Ang Thong es uno de los paisajes marinos más espectaculares del viaje.',
    ],
    tradeoffs: [
      'Las zonas famosas pueden estar masificadas.',
      'Calor muy fuerte en Bangkok durante mayo.',
      'Más vuelos internos que en Malasia.',
      'Ang Thong y los ferris dependen del estado del mar.',
    ],
    may: {
      verdict: 'Funciona, eligiendo bien la costa',
      text: 'Mayo es un mes de transición. El Golfo suele ser la apuesta sensata, mientras Krabi, Phuket y Phi Phi tienden a empeorar según avanza el mes. Bangkok y Chiang Mai estarán calurosos, con tormentas por la tarde cada vez más habituales.',
    },
  },
  malaysia: {
    name: 'Malasia',
    kicker: 'La sorpresa que nadie se espera',
    overview:
      'Malasia es menos obvia y por eso sorprende: rascacielos junto a mezquitas y templos hindúes, colinas de té envueltas en niebla, una de las capitales gastronómicas de Asia y unas islas de agua transparente justo en su mejor época. Exige algo más de logística a cambio de menos multitudes.',
    heroImage: 'my-langtengah',
    gallery: ['my-batu', 'my-perhentian', 'my-cameron2', 'my-petronas', 'my-redang2', 'my-jetty', 'my-mossy', 'my-nasilemak'],
    signature: [
      { title: 'Snórkel en las Perhentian', text: 'Arrecifes cerca de la orilla y posibilidad de ver tortugas, sin garantías.' },
      { title: 'Batu Caves al amanecer', text: 'Una escalinata de colores que sube hacia una cueva sagrada hindú.' },
      { title: 'Comer en Penang', text: 'Puestos de calle que por sí solos justifican el viaje.' },
      { title: 'Té en Cameron Highlands', text: 'Colinas verdes y bosque musgoso para escapar del calor.' },
    ],
    cities: [
      { name: 'Kuala Lumpur', text: 'Moderna y multicultural: Torres Petronas, barrios chino e indio y comida a cualquier hora.' },
      { name: 'George Town', text: 'Casco histórico Patrimonio de la Humanidad, arte urbano y muelles de clanes sobre el agua.' },
    ],
    topics: [
      {
        id: 'culture', title: 'Cultura y templos', lead: 'Tres culturas en un mismo paseo.',
        body: 'Malasia mezcla tradiciones malaya, china e india. En una misma mañana se pasa de una mezquita a un templo hindú o a una casa de clan china. Es un país de mayoría musulmana: conviene vestir con respeto, sobre todo en la costa este.',
        highlights: ['Batu Caves', 'Kek Lok Si', 'Museo de Arte Islámico'],
        image: 'my-keklok',
      },
      {
        id: 'beaches', title: 'Playas tropicales', lead: 'Arena muy blanca y agua cristalina.',
        body: 'Las Perhentian, Redang y Lang Tengah están entre las mejores playas de la península, y mayo cae en plena temporada. Hay menos servicios que en Tailandia, y esa es precisamente parte de su encanto.',
        highlights: ['Long Beach', 'Coral Bay', 'Pasir Panjang en Redang'],
        image: 'my-redang',
      },
      {
        id: 'nature', title: 'Parques y naturaleza', lead: 'De las selvas antiguas a los arrecifes.',
        body: 'Cameron Highlands regala frescor y bosque nublado. Quien tenga días extra puede plantearse Taman Negara, una de las selvas más antiguas del mundo, o Borneo, aunque ambos alargarían demasiado la ruta principal.',
        highlights: ['Mossy Forest', 'Parque marino de las Perhentian', 'Taman Negara (opcional)'],
        image: 'my-tamannegara',
      },
      {
        id: 'food', title: 'Gastronomía', lead: 'Tres cocinas compitiendo en la misma calle.',
        body: 'Nasi lemak, roti canai, laksa, satay y char kway teow. Penang es la gran referencia, pero también se come de maravilla en Jalan Alor, en Kuala Lumpur. El precio de la comida local es muy bajo, aunque el alcohol es caro por impuestos.',
        highlights: ['Hawkers de George Town', 'Jalan Alor', 'Nasi lemak de desayuno'],
        image: 'my-jalanalor',
      },
      {
        id: 'nightlife', title: 'Vida nocturna', lead: 'Existe, pero no es la razón para ir.',
        body: 'Kuala Lumpur tiene azoteas y bares, y Penang algunos locales con ambiente. En las Perhentian la noche consiste en una cerveza en la playa, si la hay: la oferta de alcohol es limitada y el plan suele ser tranquilo.',
        highlights: ['Azoteas de Kuala Lumpur', 'Love Lane en Penang', 'Long Beach al anochecer'],
        image: 'my-petronas',
      },
      {
        id: 'hopping', title: 'Island hopping', lead: 'Más contenido, pero muy bonito.',
        body: 'Entre las dos Perhentian se salta en taxi-barco y hay excursiones de snórkel por varios puntos. Pasar a Redang o Lang Tengah supone contratar transporte aparte, por lo que en 15 días lo razonable es elegir una base y disfrutarla.',
        highlights: ['Kecil ↔ Besar', 'Excursiones de snórkel', 'Lang Tengah como alternativa'],
        image: 'my-besar',
      },
    ],
    advantages: [
      'Las islas de la costa este están en plena temporada.',
      'Menos masificada y algo más barata.',
      'Gastronomía excepcional en Penang.',
      'Cameron Highlands alivia el calor.',
    ],
    tradeoffs: [
      'Cruzar de Penang a la costa este consume un día entero.',
      'Vida nocturna mucho más discreta.',
      'Islas con pocos servicios: hay que llevar efectivo.',
      'Menos opciones para saltar entre islas.',
    ],
    may: {
      verdict: 'Muy buen encaje con las islas',
      text: 'Mayo cae dentro de la temporada habitual de la costa este, con mar normalmente tranquilo en Perhentian, Redang y Lang Tengah. Kuala Lumpur y Penang pueden tener duchas tropicales, y Langkawi entra en un periodo menos favorable.',
    },
  },
}
