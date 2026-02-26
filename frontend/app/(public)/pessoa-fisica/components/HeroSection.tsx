'use client';

import { RefObject, useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';

const CTA_HREF =
  'https://wa.me/5521988179407?text=Olá!%20Gostaria%20de%20uma%20cotação%20de%20plano%20de%20saúde%20para%20pessoa%20física.';

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 120 };

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { ...SPRING, delay: 0.15 * i },
});

const { hero } = pfPageContent;

export default function HeroSection({
  scrollWrapperRef,
}: {
  scrollWrapperRef: RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const { scrollYProgress } = useScroll({
    target: scrollWrapperRef,
    offset: ['start start', 'end start'],
  });
  // Segunda seção sobe mais rápido: animação termina por volta de 65% do scroll
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.45, 0.65, 1], [1.25, 1.08, 0.95, 0.85, 0.85]);
  const y = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.65, 1], ['0px', '8vh', '12vh', '12vh', '12vh']);

  return (
    <section
      ref={ref}
      id="hero"
      data-hero-version="2"
      className="relative z-10 min-h-[100vh] overflow-visible"
      style={{ background: PF_TOKENS.bg }}
    >
      {/* Hero: mesma largura do header (1400px), título + CTAs mais largos */}
      <div className="relative z-[1] pt-[108px] sm:pt-[136px] lg:pt-[152px]">
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-8 lg:gap-6 xl:gap-8 items-center">
            {/* Coluna esquerda: mais largura para o conteúdo (título + subtítulo) */}
            <div className="min-w-0">
              <motion.div
                className="inline-block rounded-[100px] px-4 py-2 mb-5 text-sm font-medium"
                style={{
                  background: PF_TOKENS.bgAlt,
                  color: PF_TOKENS.textMuted,
                  border: `1px solid ${PF_TOKENS.border}`,
                }}
                {...stagger(0)}
                animate={inView ? stagger(0).animate : stagger(0).initial}
              >
                {hero.badge}
              </motion.div>

              <motion.h1
                className="text-[32px] sm:text-[42px] lg:text-[52px] xl:text-[58px] font-bold leading-[1.15] mb-5 text-left"
                style={{ color: PF_TOKENS.text, letterSpacing: '-0.02em' }}
                {...stagger(1)}
                animate={inView ? stagger(1).animate : stagger(1).initial}
              >
                {hero.title.split(hero.titleHighlight).map((part, i) => (
                  <span key={i}>
                    {part}
                    {i === 0 && (
                      <span
                        className="inline-block px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl mx-0.5 text-white"
                        style={{ background: PF_TOKENS.gradient, backgroundSize: '100% 100%' }}
                      >
                        {hero.titleHighlight}
                      </span>
                    )}
                  </span>
                ))}
              </motion.h1>

              <motion.p
                className="text-base sm:text-lg leading-7 text-left max-w-3xl"
                style={{ color: PF_TOKENS.textMuted }}
                {...stagger(2)}
                animate={inView ? stagger(2).animate : stagger(2).initial}
              >
                {hero.subtitle}
              </motion.p>
            </div>

            {/* Coluna direita: trust + CTAs lado a lado (gap 20–30px) – mesmo código da ref */}
            <div className="flex flex-col items-start lg:items-end gap-6 w-full lg:w-auto shrink-0">
              {hero.trustLine && (
                <motion.div
                  className="flex items-center gap-2.5"
                  style={{ color: PF_TOKENS.textMuted }}
                  {...stagger(3)}
                  animate={inView ? stagger(3).animate : stagger(3).initial}
                >
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" style={{ color: PF_TOKENS.primary }} strokeWidth={2} />
                  <span className="text-sm font-medium">{hero.trustLine}</span>
                </motion.div>
              )}

              <motion.div
                className="flex flex-row gap-5 sm:gap-6 w-full sm:w-auto flex-nowrap"
                {...stagger(4)}
                animate={inView ? stagger(4).animate : stagger(4).initial}
              >
                <motion.a
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold border-2 transition-colors"
                  style={{
                    color: PF_TOKENS.text,
                    borderColor: PF_TOKENS.text,
                    background: PF_TOKENS.bg,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = PF_TOKENS.bgAlt;
                    e.currentTarget.style.borderColor = PF_TOKENS.borderHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = PF_TOKENS.bg;
                    e.currentTarget.style.borderColor = PF_TOKENS.text;
                  }}
                >
                  {hero.secondaryCta}
                </motion.a>
                <motion.a
                  href={CTA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white transition-colors"
                  style={{
                    background: PF_TOKENS.text,
                    color: PF_TOKENS.bg,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = PF_TOKENS.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = PF_TOKENS.text;
                  }}
                >
                  {hero.primaryCta}
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </motion.a>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Faixa dourada: vídeo com mesma animação de entrada do título (opacity + y) */}
        <div
          className="relative z-0 mt-[11vh] sm:mt-[15vh] lg:mt-[19vh] min-h-[16vh] w-full pt-6 sm:pt-8 overflow-visible"
          style={{ background: PF_TOKENS.heroVideoSectionBg }}
          aria-hidden
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING, delay: 0.5 }}
            className="relative mx-auto max-w-[1100px] px-4 sm:px-6 origin-center -mt-[16vh]"
          >
            <motion.div
              className="relative w-full"
              style={{ scale, y }}
            >
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: PF_TOKENS.bg,
                border: `1px solid ${PF_TOKENS.borderHover}`,
                boxShadow:
                  'inset 0 0 0 8px rgba(0,0,0,0.02), 0 20px 50px -12px rgba(0,0,0,0.12)',
                padding: '8px',
              }}
            >
              <div
                className="relative rounded-[20px] overflow-hidden aspect-[16/10] sm:aspect-video"
                style={{
                  backdropFilter: 'blur(15px)',
                  WebkitBackdropFilter: 'blur(15px)',
                  background: `radial-gradient(71.86% 50% at 50% 0%, ${PF_TOKENS.primarySoft} 0%, transparent 100%), rgba(0, 0, 0, 0.08)`,
                  border: `1px solid ${PF_TOKENS.borderHover}`,
                }}
              >
                <Image
                  src="/brand/alice/mapa-rede-credenciada.webp"
                  alt="Rede credenciada das operadoras que a Humano Saúde compara para você"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 1216px"
                  priority
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.75) 100%)',
                  }}
                />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)',
                      color: PF_TOKENS.text,
                      border: `1px solid ${PF_TOKENS.border}`,
                    }}
                  >
                    Rede nacional das operadoras que comparamos
                  </span>
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
