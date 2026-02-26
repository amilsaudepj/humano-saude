'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';
import TitleReveal from './TitleReveal';

const SPRING = { type: 'spring' as const, damping: 24, stiffness: 260 };
const { detailsMatter } = pfPageContent;

/** Tipografia Family: parágrafos (19px, 27px line-height, -0.3px letter-spacing) */
const familyParagraph = {
  fontWeight: 400,
  fontSize: '19px',
  lineHeight: '27px',
  letterSpacing: '-0.3px',
  color: PF_TOKENS.textMuted,
} as const;

/** Box de estado "Analyzing Transaction" – Family */
function AnalyzingStateBox() {
  return (
    <div
      className="mt-5 flex items-center justify-center gap-3 rounded-2xl border py-5 px-6"
      style={{
        background: 'rgba(184, 148, 31, 0.08)',
        borderColor: 'rgba(184, 148, 31, 0.25)',
      }}
    >
      <div
        className="h-8 w-8 flex-shrink-0 animate-spin rounded-full border-2 border-t-transparent"
        style={{
          borderColor: `${PF_TOKENS.primary}40`,
          borderTopColor: PF_TOKENS.primary,
        }}
      />
      <span className="font-medium" style={{ color: PF_TOKENS.primary, fontSize: '15px' }}>
        Analisando sua cotação
      </span>
    </div>
  );
}

export default function SectionDetailsMatter() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="relative py-16 sm:py-24"
      style={{ background: PF_TOKENS.bg }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Family: SectionDetails_Details – grid 2 col, flex na coluna direita */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Coluna esquerda: headline + subtitle (Family) */}
          <motion.div
            className="lg:sticky lg:top-28"
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...SPRING, delay: 0 }}
          >
            <TitleReveal
              className="text-3xl sm:text-4xl lg:text-[44px] font-medium leading-tight mb-5"
              style={{ color: PF_TOKENS.text, letterSpacing: '-0.02em' }}
            >
              {detailsMatter.title}
            </TitleReveal>
            <p className="text-lg leading-relaxed" style={{ ...familyParagraph, color: PF_TOKENS.textMuted }}>
              {detailsMatter.subtitle}
            </p>
          </motion.div>

          {/* Coluna direita: SectionDetails_DetailContainer + Panel (flex column, gap 0.4375rem) */}
          <div className="flex flex-col gap-10 lg:gap-12">
            {detailsMatter.features.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="flex flex-col"
                style={{ gap: '0.4375rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...SPRING, delay: 0.1 + i * 0.1 }}
              >
                <h3
                  className="text-xl font-semibold"
                  style={{ color: PF_TOKENS.primary }}
                >
                  {feat.title}
                </h3>
                <p className="leading-relaxed" style={familyParagraph}>
                  {feat.description}
                </p>
                {i === 0 && <AnalyzingStateBox />}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
