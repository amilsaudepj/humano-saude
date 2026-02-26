'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/** Logos de hospitais (/images/logos). Com filtro branco; removidas as que viram caixa branca (ex.: barra dor.gif, copa star). */
/** Posições bem espalhadas (distância entre elas). Samaritano, Casa de Saúde São José, São Vicente e CHN com tamanho maior. */
const HOSPITAL_LOGOS = [
  { src: '/images/logos/logo copa dor.webp', top: '8%', left: '8%', size: 'w-20 h-20', sizeLg: 'md:w-24 md:h-24', speedKey: 'fast' as const },
  { src: '/images/logos/logo hospital samaritano.png', top: '12%', left: '32%', size: 'w-24 h-24', sizeLg: 'md:w-32 md:h-32', speedKey: 'slow' as const },
  { src: '/images/logos/logo pro cardiaco.webp', top: '8%', left: '58%', size: 'w-18 h-18', sizeLg: 'md:w-22 md:h-22', speedKey: 'medium' as const },
  { src: '/images/logos/logo quinta dor.png', top: '10%', left: '88%', size: 'w-20 h-20', sizeLg: 'md:w-24 md:h-24', speedKey: 'fast' as const },
  { src: '/images/logos/logo casa de saude sao jose.png', top: '38%', left: '5%', size: 'w-24 h-24', sizeLg: 'md:w-32 md:h-32', speedKey: 'medium' as const },
  { src: '/images/logos/logo sao vicente gavea.svg', top: '42%', left: '28%', size: 'w-24 h-24', sizeLg: 'md:w-32 md:h-32', speedKey: 'slow' as const },
  { src: '/images/logos/logo CHN.png', top: '38%', left: '55%', size: 'w-24 h-24', sizeLg: 'md:w-32 md:h-32', speedKey: 'fast' as const },
  { src: '/images/logos/logo sao vicente de paulo.png', top: '42%', left: '82%', size: 'w-24 h-24', sizeLg: 'md:w-32 md:h-32', speedKey: 'medium' as const },
  { src: '/images/logos/logo badim.png', top: '68%', left: '10%', size: 'w-18 h-18', sizeLg: 'md:w-22 md:h-22', speedKey: 'slow' as const },
  { src: '/images/logos/logo norte dor.svg', top: '72%', left: '35%', size: 'w-20 h-20', sizeLg: 'md:w-24 md:h-24', speedKey: 'fast' as const },
  { src: '/images/logos/logo pasteur.png', top: '70%', left: '62%', size: 'w-18 h-18', sizeLg: 'md:w-22 md:h-22', speedKey: 'medium' as const },
  { src: '/images/logos/logo hospital vitoria.png', top: '72%', left: '88%', size: 'w-20 h-20', sizeLg: 'md:w-24 md:h-24', speedKey: 'slow' as const },
  { src: '/images/logos/logo jutta batista.png', top: '92%', left: '22%', size: 'w-16 h-16', sizeLg: 'md:w-20 md:h-20', speedKey: 'fast' as const },
];

/** Logo com filtro branco; <img> para suportar SVG e evitar caixa branca em alguns PNG/JPEG. */
function LogoHospital({ src, alt, sizeClass }: { src: string; alt: string; sizeClass: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`object-contain select-none ${sizeClass}`}
      style={{ filter: 'brightness(0) invert(1)' }}
      loading="lazy"
      draggable={false}
    />
  );
}

export default function StickyStatsReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // --- Textos em cascata: vêm de baixo para cima, transição suave (mais keyframes = curva suave) ---
  // Linha 1: entra de baixo, desacelera ao chegar (keyframes em curva ease-out)
  const opacity1 = useTransform(scrollYProgress, [0, 0.06, 0.14, 0.22], [0, 0.6, 1, 1]);
  const y1 = useTransform(scrollYProgress, [0, 0.06, 0.14, 0.22], ['120%', '35%', '4%', '0%']);

  const opacity2 = useTransform(scrollYProgress, [0.24, 0.3, 0.38, 0.46], [0, 0.6, 1, 1]);
  const y2 = useTransform(scrollYProgress, [0.24, 0.3, 0.38, 0.46], ['120%', '35%', '4%', '0%']);

  const opacity3 = useTransform(scrollYProgress, [0.48, 0.54, 0.62, 0.72], [0, 0.6, 1, 1]);
  const y3 = useTransform(scrollYProgress, [0.48, 0.54, 0.62, 0.72], ['120%', '35%', '4%', '0%']);

  // --- Parallax 3D: logos em velocidades diferentes (profundidade) ---
  const yFast = useTransform(scrollYProgress, [0, 1], ['0px', '-200px']);
  const yMedium = useTransform(scrollYProgress, [0, 1], ['0px', '-100px']);
  const ySlow = useTransform(scrollYProgress, [0, 1], ['0px', '-50px']);

  const speedMap = { fast: yFast, medium: yMedium, slow: ySlow };

  return (
    <div ref={containerRef} className="relative w-full h-[300vh] bg-black">
      <section className="sticky top-0 w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
        {/* Camada de fundo: logos de hospitais com filtro branco, bem espalhadas, parallax */}
        <div className="absolute inset-0 pointer-events-none max-w-7xl mx-auto w-full h-full">
          {HOSPITAL_LOGOS.map((logo, index) => (
            <div
              key={`${logo.src}-${index}`}
              className={`absolute flex items-center justify-center ${logo.size} ${logo.sizeLg}`}
              style={{
                top: logo.top,
                left: logo.left,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <motion.div
                className="relative w-full h-full flex items-center justify-center opacity-80"
                style={{ y: speedMap[logo.speedKey] }}
              >
                <LogoHospital
                  src={logo.src}
                  alt=""
                  sizeClass="w-full h-full max-w-full max-h-full"
                />
              </motion.div>
            </div>
          ))}
        </div>

        {/* Camada frontal: textos estilo cascata (máscara overflow-hidden) */}
        <div className="relative z-10 flex flex-col items-center gap-8 md:gap-12 px-6">
          <h2 className="text-2xl md:text-3xl font-medium text-slate-400 text-center">
            Uma rede em expansão com
          </h2>

          <div className="flex flex-col items-center gap-8 md:gap-10">
            {/* Máscara mais alta: o título sobe de baixo e “pousa” com transição suave */}
            <div className="h-[72px] md:h-[120px] overflow-hidden flex items-center justify-center">
              <motion.div
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white text-center whitespace-nowrap"
                style={{ opacity: opacity1, y: y1, willChange: 'transform, opacity' }}
              >
                +1.500 <span className="text-emerald-400">médicos</span>
              </motion.div>
            </div>

            <div className="h-[72px] md:h-[120px] overflow-hidden flex items-center justify-center">
              <motion.div
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white text-center whitespace-nowrap"
                style={{ opacity: opacity2, y: y2, willChange: 'transform, opacity' }}
              >
                120 <span className="text-blue-400">laboratórios</span>
              </motion.div>
            </div>

            <div className="h-[72px] md:h-[120px] overflow-hidden flex items-center justify-center">
              <motion.div
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-center whitespace-nowrap bg-clip-text text-transparent"
                style={{
                  opacity: opacity3,
                  y: y3,
                  willChange: 'transform, opacity',
                  backgroundImage: 'linear-gradient(105deg, #F6E05E 0%, #E5C84A 25%, #D4AF37 50%, #C19B2E 75%, #AA8A2E 100%)',
                  backgroundSize: '100% 100%',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                Acesso aos melhores hospitais
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
