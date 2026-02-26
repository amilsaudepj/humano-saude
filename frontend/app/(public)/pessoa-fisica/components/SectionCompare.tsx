'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';
import TitleReveal from './TitleReveal';

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 120 };

const { compare } = pfPageContent;

/** Logos oficiais das operadoras (pasta /images/operadoras) */
const OPERADORA_LOGO: Record<string, string> = {
  'Amil': '/images/operadoras/amil-logo.png',
  'Bradesco Saúde': '/images/operadoras/bradesco-logo.png',
  'SulAmérica': '/images/operadoras/sulamerica-logo.png',
};

export default function SectionCompare() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      id="compare"
      className="relative py-16 sm:py-24"
      style={{ background: PF_TOKENS.bg }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING, delay: 0 }}
        >
          <TitleReveal
            className="text-3xl sm:text-4xl lg:text-[44px] font-medium leading-tight mb-4"
            style={{ color: PF_TOKENS.text, letterSpacing: '-0.02em' }}
          >
            {compare.title}
          </TitleReveal>
          {compare.subtitle && (
            <p className="text-lg max-w-2xl mx-auto" style={{ color: PF_TOKENS.textMuted }}>
              {compare.subtitle}
            </p>
          )}
        </motion.div>

        {/* Grid de operadoras – estilo Alice chart / Reflect feature grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {compare.items.map((item, i) => {
            const logoSrc = OPERADORA_LOGO[item.name];
            return (
              <motion.div
                key={item.name}
                className="rounded-2xl p-6 sm:p-8 border text-center relative overflow-hidden flex flex-col items-center justify-center"
                style={{
                  background: PF_TOKENS.bgAlt,
                  borderColor: PF_TOKENS.border,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...SPRING, delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -4, borderColor: PF_TOKENS.primaryMuted }}
              >
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(to bottom, transparent 0%, ${PF_TOKENS.primarySoft} 100%)`,
                  }}
                />
                <div className="relative flex flex-col items-center">
                  {logoSrc ? (
                    <div className="relative w-24 h-16 sm:w-28 sm:h-18 mb-4 flex-shrink-0">
                      <Image
                        src={logoSrc}
                        alt={item.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 96px, 112px"
                      />
                    </div>
                  ) : null}
                  {!logoSrc ? (
                    <h3 className="text-lg sm:text-xl font-semibold mb-1" style={{ color: PF_TOKENS.text }}>
                      {item.name}
                    </h3>
                  ) : null}
                  <p className="text-sm text-center" style={{ color: PF_TOKENS.textMuted }}>
                    {item.tag}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
