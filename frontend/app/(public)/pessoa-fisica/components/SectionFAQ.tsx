'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';

const SPRING = { type: 'spring' as const, damping: 24, stiffness: 300 };
const { faq } = pfPageContent;

export default function SectionFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      id="faq"
      className="relative py-16 sm:py-24"
      style={{ background: PF_TOKENS.bg }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Duas colunas: título à esquerda, FAQ à direita (como referência ClonewebX) */}
        <div className="grid md:grid-cols-[1fr_1.6fr] gap-10 md:gap-12 lg:gap-16 md:items-start">
          {/* Coluna esquerda: título com palavra destacada em pill */}
          <motion.div
            className="md:sticky md:top-24"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING, delay: 0 }}
          >
            <h2
              className="text-4xl sm:text-5xl lg:text-[3rem] xl:text-[3.25rem] font-bold leading-tight tracking-tight"
              style={{ color: PF_TOKENS.text, letterSpacing: '-0.03em' }}
            >
              <span className="block">
                {faq.title.split(' ').slice(0, -1).join(' ')}
              </span>
              <span className="block mt-2">
                <span
                  className="inline-block px-4 py-1.5 rounded-xl text-white font-bold text-3xl sm:text-4xl lg:text-[2.75rem] align-middle"
                  style={{
                    background: `linear-gradient(90deg, ${PF_TOKENS.gradientStart} 0%, ${PF_TOKENS.primary} 50%, ${PF_TOKENS.gradientEnd} 100%)`,
                    boxShadow: '0 2px 12px rgba(184, 148, 31, 0.35)',
                  }}
                >
                  {faq.title.split(' ').pop()}
                </span>
                {' '}
                <span className="font-bold">{faq.subtitle.split(' ')[0]}</span>
              </span>
              <span className="block mt-2">
                {faq.subtitle.split(' ').slice(1).join(' ')}
              </span>
            </h2>
          </motion.div>

          {/* Coluna direita: lista de FAQ em cards com chevron */}
          <div className="space-y-4">
            {faq.items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...SPRING, delay: 0.05 * index }}
                className="rounded-xl border border-neutral-100 bg-neutral-50/80 shadow-sm transition-all duration-300 hover:shadow-md"
                style={{
                  borderColor: openIndex === index ? PF_TOKENS.primaryMuted : undefined,
                  background: openIndex === index ? PF_TOKENS.primarySoft : undefined,
                }}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-left"
                  aria-expanded={openIndex === index}
                >
                  <span className="text-base sm:text-lg font-medium flex-1" style={{ color: PF_TOKENS.text }}>
                    {item.question}
                  </span>
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 transition-transform duration-300"
                    style={{ transform: openIndex === index ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    aria-hidden
                  >
                    <ChevronRight className="w-5 h-5" />
                  </span>
                </button>
                <div
                  className={`transition-all duration-300 ease-out overflow-hidden ${openIndex === index ? 'max-h-[320px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p
                    className="px-5 sm:px-6 pb-5 pt-0 text-base leading-relaxed border-t border-neutral-100"
                    style={{ color: PF_TOKENS.textMuted }}
                  >
                    {item.answer}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
