'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Play, Check } from 'lucide-react';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';
import TitleReveal from './TitleReveal';

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 120 };

const { videoChecklist } = pfPageContent;

export default function SectionVideoChecklist() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  /** ClonewebX: parallax/scrub – vídeo scale 1 → 0.85 e fundo y/scale conforme scroll */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const videoScale = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [1, 0.92, 0.85, 0.85]);
  const bgY = useTransform(scrollYProgress, [0, 0.5], ['0%', '-25%']);
  const bgScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.4]);

  return (
    <section
      ref={ref}
      className="relative py-16 sm:py-24 lg:py-28 overflow-hidden"
      style={{ background: PF_TOKENS.bg }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Coluna vídeo – ClonewebX: scale + layer de fundo com scrub */}
          <motion.div
            className="relative rounded-2xl overflow-hidden order-2 lg:order-1"
            style={{
              border: `1px solid ${PF_TOKENS.borderHover}`,
              boxShadow: 'inset 0 0 0 8px rgba(0,0,0,0.03), 0 20px 50px -12px rgba(0, 0, 0, 0.12)',
              padding: '8px',
              scale: videoScale,
            }}
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...SPRING, delay: 0.1 }}
          >
            {/* Layer de fundo (parallax) – ClonewebX #brxe-bsfdij */}
            <motion.div
              className="absolute inset-0 -z-10 rounded-xl opacity-30"
              style={{
                y: bgY,
                scale: bgScale,
                background: `radial-gradient(ellipse 80% 50% at 50% 50%, ${PF_TOKENS.primarySoft} 0%, transparent 70%)`,
              }}
            />
            <div className="aspect-video relative rounded-xl overflow-hidden" style={{ background: 'rgba(5, 5, 5, 0.5)' }}>
              <Image
                src="/brand/alice/video-poster.jpg"
                alt="Atendimento rápido Humano Saúde"
                fill
                className="object-cover opacity-80"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, transparent 40%, rgba(5, 5, 5, 0.6) 100%)',
                }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING}
                >
                  <Play className="w-8 h-8 text-white/90 ml-1 fill-current" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Coluna checklist – Alice c-checklist */}
          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING, delay: 0.2 }}
          >
            <TitleReveal
              className="text-3xl sm:text-4xl font-medium leading-tight mb-8"
              style={{ color: PF_TOKENS.text, letterSpacing: '-0.02em' }}
            >
              {videoChecklist.title}
            </TitleReveal>
            <ul className="space-y-6">
              {videoChecklist.bullets.map((text, i) => (
                <motion.li
                  key={i}
                  className="flex gap-4 items-start"
                  initial={{ opacity: 0, x: 20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ ...SPRING, delay: 0.3 + i * 0.1 }}
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: PF_TOKENS.primarySoft,
                      border: `1px solid ${PF_TOKENS.primaryMuted}`,
                    }}
                  >
                    <Check className="w-4 h-4" style={{ color: PF_TOKENS.primary }} strokeWidth={2.5} />
                  </span>
                  <span className="text-lg leading-relaxed pt-0.5" style={{ color: PF_TOKENS.textMuted }}>
                    {text}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
