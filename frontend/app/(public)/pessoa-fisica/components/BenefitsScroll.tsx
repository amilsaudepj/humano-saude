'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { aliceContent } from '../content/aliceContent';
import { PF_TOKENS } from '../content/pfDesignTokens';

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 120 };

const { benefits } = aliceContent;

const IMAGES = [
  '/brand/alice/hospitais-alice.webp',
  '/brand/alice/mapa-rede-credenciada.webp',
  '/brand/alice/portal-alice.webp',
];

const RGBS = [
  '184, 148, 31',
  '191, 149, 63',
  '170, 119, 28',
];

export default function BenefitsScroll() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-20 sm:py-28 overflow-hidden" style={{ background: PF_TOKENS.bg }}>
      <div className="text-center max-w-[800px] mx-auto px-4 sm:px-6 mb-14">
        <motion.h2
          className="text-[40px] sm:text-[48px] lg:text-[56px] font-medium leading-[1.14] mb-4"
          style={{ color: PF_TOKENS.text, letterSpacing: '-0.02em' }}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING, delay: 0 }}
        >
          {benefits.title}
        </motion.h2>
        {benefits.subtitle && (
          <motion.p
            className="text-base leading-6 max-w-[640px] mx-auto"
            style={{ color: PF_TOKENS.textMuted }}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING, delay: 0.1 }}
          >
            {benefits.subtitle}
          </motion.p>
        )}
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] rounded-3xl overflow-hidden border" style={{ borderColor: PF_TOKENS.border }}>
          {benefits.items.map((b, i) => (
            <motion.div
              key={b.title}
              className="group relative overflow-hidden"
              style={{
                background:
                  `radial-gradient(100% 146.88% at ${i % 2 === 0 ? '100% 100%' : '0% 100%'}, rgba(${RGBS[i % RGBS.length]}, 0.03) 0%, transparent 100%)`,
              }}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING, delay: 0.1 * i }}
            >
              {/* Card image */}
              <div className="h-[220px] sm:h-[256px] relative flex items-center justify-center overflow-hidden">
                <Image
                  src={IMAGES[i % IMAGES.length]}
                  alt={b.title}
                  fill
                  className="object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(60% 60% at 50% 50%, rgba(${RGBS[i % RGBS.length]}, 0.06) 0%, transparent 100%)`,
                  }}
                />
                {/* Orbital dots */}
                {[0, 1, 2].map((d) => (
                  <motion.div
                    key={d}
                    className="absolute w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      backdropFilter: 'blur(4px)',
                      background: `rgba(${RGBS[i % RGBS.length]}, 0.03)`,
                      border: `1px solid rgba(${RGBS[i % RGBS.length]}, 0.1)`,
                      left: `${30 + d * 20}%`,
                      top: `${25 + (d % 2) * 30}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.3 + d * 0.15, duration: 1, ease: [0.6, 0.6, 0, 1] }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: `linear-gradient(180deg, rgba(${RGBS[i % RGBS.length]}, 0) 0%, rgba(${RGBS[i % RGBS.length]}, 0.32) 100%), rgba(${RGBS[i % RGBS.length]}, 0.01)`,
                        boxShadow: `0 0 20px rgba(${RGBS[i % RGBS.length]}, 0.25), inset 0 0 5px rgba(${RGBS[i % RGBS.length]}, 0.15)`,
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Card content */}
              <div className="px-6 sm:px-8 pb-8 relative">
                <div
                  className="absolute left-0 top-0 w-[1px] h-4"
                  style={{ background: `rgba(${RGBS[i % RGBS.length]}, 0.24)` }}
                />
                <h3
                  className="text-base font-medium mb-2"
                  style={{ color: PF_TOKENS.text }}
                >
                  {b.title}
                </h3>
                <p
                  className="text-base leading-6"
                  style={{ color: PF_TOKENS.textMuted }}
                >
                  {b.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
