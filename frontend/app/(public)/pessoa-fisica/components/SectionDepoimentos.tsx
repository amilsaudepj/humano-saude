'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 120 };

const { depoimentos } = pfPageContent;

export default function SectionDepoimentos() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section
      ref={ref}
      id="depoimentos"
      className="relative py-16 sm:py-24 overflow-hidden"
      style={{ background: PF_TOKENS.bg }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.h2
          className="text-center text-3xl sm:text-4xl font-medium leading-tight mb-12"
          style={{ color: PF_TOKENS.text, letterSpacing: '-0.02em' }}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING, delay: 0 }}
        >
          {depoimentos.title}
        </motion.h2>

        {/* Carousel / panels – Family testimonials style */}
        <div className="relative rounded-3xl overflow-hidden border min-h-[280px] sm:min-h-[320px] flex flex-col"
          style={{
            background: PF_TOKENS.bgAlt,
            borderColor: PF_TOKENS.border,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              className="flex-1 p-8 sm:p-12 flex flex-col justify-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={SPRING}
            >
              <blockquote className="text-xl sm:text-2xl leading-relaxed mb-6" style={{ color: PF_TOKENS.textMuted }}>
                &ldquo;{depoimentos.items[activeIndex].quote}&rdquo;
              </blockquote>
              <footer>
                <cite className="not-italic font-semibold" style={{ color: PF_TOKENS.text }}>
                  {depoimentos.items[activeIndex].author}
                </cite>
                {depoimentos.items[activeIndex].role && (
                  <span className="block text-sm mt-1" style={{ color: PF_TOKENS.textCaption }}>
                    {depoimentos.items[activeIndex].role}
                  </span>
                )}
              </footer>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-2 pb-8">
            {depoimentos.items.map((_, i) => (
              <motion.button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className="w-2.5 h-2.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8941F]"
                style={{
                  background: activeIndex === i ? PF_TOKENS.primary : 'rgba(0, 0, 0, 0.2)',
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING}
                aria-label={`Depoimento ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
