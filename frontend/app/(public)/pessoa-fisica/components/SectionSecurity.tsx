'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Lock } from 'lucide-react';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';

const SPRING = { type: 'spring' as const, damping: 24, stiffness: 260 };
const { security } = pfPageContent;

const GOLD = '#D4AF37';
/** Gradiente título estilo Reflect (encryption section) */
const securityTitleGradient = `linear-gradient(135deg, #ffffff 0%, ${GOLD} 40%, #ffffff 100%)`;

/** Caracteres tipo “código” para fundo (Reflect encryption) */
const CODE_CHARS = 'B2gsa33X FIMSUROX SKX+fuz 7h9kL2 0pQr4 8mNv3 aBc12 DeF56'.split(' ');

export default function SectionSecurity() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="encryption relative overflow-hidden"
      style={{
        background: '#0a0a0a',
        paddingTop: 'clamp(4rem, 12vw, 222px)',
        paddingBottom: 'clamp(4rem, 12vw, 236px)',
      }}
    >
      {/* Reflect: fundo com padrão de “código” sutil */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.07]" aria-hidden>
        <div className="absolute inset-0 flex flex-wrap gap-x-6 gap-y-2 p-8 text-[11px] font-mono leading-loose" style={{ color: GOLD }}>
          {Array.from({ length: 80 }, (_, i) => (
            <span key={i} className="opacity-70">{CODE_CHARS[i % CODE_CHARS.length]}</span>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${GOLD} 1px, transparent 0)`,
            backgroundSize: '20px 20px',
          }}
        />
      </div>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20"
        style={{ background: PF_TOKENS.primary }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING, delay: 0 }}
        >
          <div
            className="section-header-badge inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border"
            style={{
              borderColor: 'rgba(212, 175, 55, 0.4)',
              background: 'rgba(212, 175, 55, 0.1)',
              color: GOLD,
            }}
          >
            {security.tag}
          </div>
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: GOLD,
            }}
          >
            <Lock className="w-8 h-8" />
          </div>
          <h2
            className="section-header-title text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight mb-4"
          >
            <span
              style={{
                background: securityTitleGradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {security.title}
            </span>
          </h2>
          <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
            {security.description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
