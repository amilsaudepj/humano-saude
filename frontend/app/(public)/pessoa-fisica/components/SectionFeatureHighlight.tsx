'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Monitor, ShieldCheck } from 'lucide-react';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';

const SPRING = { type: 'spring' as const, damping: 24, stiffness: 260 };
const { featureHighlight } = pfPageContent;

/** Gradiente para título no estilo Reflect (section-header-title) */
const titleGradient = `linear-gradient(135deg, ${PF_TOKENS.text} 0%, ${PF_TOKENS.primary} 50%, ${PF_TOKENS.text} 100%)`;

export default function SectionFeatureHighlight() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="research relative py-16 sm:py-24 overflow-hidden"
      style={{ background: PF_TOKENS.bg }}
    >
      {/* Reflect: research-radar-wrapper + research-radar (glow/radar central) */}
      <div className="research-radar-wrapper absolute inset-0 pointer-events-none flex justify-center" aria-hidden>
        <div
          className="research-radar absolute top-0 w-[min(100%,890px)] h-[min(100%,890px)] max-w-[90vw] opacity-30"
          style={{
            background: `
              radial-gradient(circle at 50% 20%, ${PF_TOKENS.primarySoft} 0%, transparent 45%),
              radial-gradient(ellipse 70% 50% at 50% 0%, ${PF_TOKENS.glow} 0%, transparent 60%)
            `,
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-25"
          style={{
            background: `radial-gradient(circle, ${PF_TOKENS.primary} 0%, transparent 65%)`,
            filter: 'blur(50px)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Reflect: section-header (badge + title + description) */}
        <motion.div
          className="section-header text-center mb-12 sm:mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING, delay: 0 }}
        >
          <div
            className="section-header-badge inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border"
            style={{
              borderColor: PF_TOKENS.primaryMuted,
              background: PF_TOKENS.primarySoft,
              color: PF_TOKENS.primary,
              boxShadow: 'none',
            }}
          >
            {featureHighlight.tag}
          </div>
          <h2
            className="section-header-title text-3xl sm:text-4xl lg:text-[44px] font-medium leading-tight mb-5 shadow-none"
            style={{ letterSpacing: '-0.02em', textShadow: 'none', boxShadow: 'none' }}
          >
            {featureHighlight.title.split(featureHighlight.titleHighlight).map((part, i) => (
              <span key={i} style={{ textShadow: 'none' }}>
                {i === 0 ? (
                  <span
                    style={{
                      background: titleGradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      WebkitTextFillColor: 'transparent',
                      textShadow: 'none',
                    }}
                  >
                    {part}
                  </span>
                ) : (
                  part
                )}
                {i === 0 && (
                  <span
                    className="highlight inline-block px-2 py-0.5 rounded-[20px] mx-0.5 shadow-none"
                    style={{
                      background: PF_TOKENS.primarySoft,
                      color: PF_TOKENS.primary,
                      boxShadow: 'none',
                      textShadow: 'none',
                    }}
                  >
                    {featureHighlight.titleHighlight}
                  </span>
                )}
              </span>
            ))}
          </h2>
          <p
            className="section-header-description text-lg max-w-2xl mx-auto"
            style={{ color: PF_TOKENS.textMuted }}
          >
            {featureHighlight.subtitle}
          </p>
        </motion.div>

        {/* Reflect: research-cards (2 feature blocks) */}
        <div className="research-cards grid sm:grid-cols-2 gap-8 sm:gap-10">
          {featureHighlight.features.map((feat, i) => (
            <motion.div
              key={feat.title}
              className="rounded-2xl p-6 sm:p-8 border flex flex-col"
              style={{
                background: PF_TOKENS.bgAlt,
                borderColor: PF_TOKENS.border,
                boxShadow: 'none',
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING, delay: 0.1 + i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: PF_TOKENS.primarySoft, color: PF_TOKENS.primary }}
              >
                {feat.icon === 'devices' ? <Monitor className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: PF_TOKENS.text }}>
                {feat.title}
              </h3>
              <p className="text-base leading-relaxed flex-1" style={{ color: PF_TOKENS.textMuted }}>
                {feat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
