import { m, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { Photo } from '../../components/ui/Photo'
import { Reveal } from '../../components/ui/Reveal'

export function Adventure() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const drift = useTransform(scrollYProgress, [0, 1], [40, -40])

  return (
    <section id="aventura" ref={ref} className="overflow-hidden bg-ivory px-5 py-24 md:px-8 md:py-36">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-12">
        <div className="md:col-span-6 md:pt-10">
          <Reveal>
            <p className="eyebrow text-gold-700">La aventura</p>
            <blockquote className="mt-5 font-display text-3xl leading-tight md:text-5xl">
              En mayo de 2027 queremos perdernos entre islas, playas paradisíacas, ciudades increíbles y naturaleza.
            </blockquote>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg text-muted">
              Buscamos saltar de isla en isla, arrecifes, miradores imposibles y noches de ciudad con comida en la calle. Quince días saliendo desde Madrid y dos candidatos con argumentos de sobra.
            </p>
          </Reveal>
        </div>

        <div className="relative md:col-span-6">
          <Reveal>
            <Photo id="th-angthong2" sizes="(min-width: 768px) 40vw, 90vw" className="aspect-[4/5] w-full md:w-4/5" />
          </Reveal>
          <m.figure style={{ y: drift }} className="absolute right-0 -bottom-10 hidden w-1/2 border-8 border-ivory md:block">
            <Photo id="my-afterglow" sizes="25vw" className="aspect-[4/3] w-full" />
          </m.figure>
          <p className="mt-3 text-sm text-muted md:w-4/5">Ang Thong, en Tailandia, y las Perhentian, en Malasia.</p>
        </div>
      </div>

      <Reveal className="mx-auto mt-28 max-w-7xl text-center md:mt-40">
        <h2 className="text-6xl sm:text-7xl md:text-9xl">
          ¿Tailandia <span className="text-gold-700 italic">o</span> Malasia?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Las dos tienen islas turquesa, templos y comida para llorar de alegría. Aquí va todo lo que necesitamos para decidir.
        </p>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-7xl gap-3 sm:grid-cols-2">
        {[
          { id: 'th-nangyuan', name: 'Tailandia', href: '#destinos', text: 'Koh Nang Yuan, en el Golfo' },
          { id: 'my-perhentian', name: 'Malasia', href: '#destinos', text: 'Islas Perhentian, en la costa este' },
        ].map(({ id, name, text }, index) => (
          <Reveal key={id} delay={index * 0.1} className="relative overflow-hidden">
            <Photo id={id} sizes="(min-width: 640px) 50vw, 100vw" className="aspect-[3/2] w-full" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ocean-950/85 to-transparent p-6 pt-16 text-ivory">
              <p className="font-display text-3xl">{name}</p>
              <p className="text-sm text-ivory/90">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
