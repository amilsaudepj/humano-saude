'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { aliceContent } from '../content/aliceContent';
import { PF_TOKENS } from '../content/pfDesignTokens';

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 120 };

const GOLD = PF_TOKENS.primary;
const GOLD_BG = 'rgba(184, 148, 31, 0.08)';

const ICONS = [
  <svg key="0" className="w-10 h-10" fill="none" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill={GOLD_BG} /><path d="M14 20l4 4 8-8" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  <svg key="1" className="w-10 h-10" fill="none" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill={GOLD_BG} /><circle cx="20" cy="20" r="8" stroke={GOLD} strokeWidth="2" /><path d="M20 12v8l4 4" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  <svg key="2" className="w-10 h-10" fill="none" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill={GOLD_BG} /><path d="M13 27V15a2 2 0 012-2h10a2 2 0 012 2v12" stroke={GOLD} strokeWidth="2" strokeLinecap="round" /><path d="M17 27v-6h6v6" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  <svg key="3" className="w-10 h-10" fill="none" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill={GOLD_BG} /><path d="M20 13l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L15 16.5l3.5-.5z" stroke={GOLD} strokeWidth="2" strokeLinejoin="round" /></svg>,
  <svg key="4" className="w-10 h-10" fill="none" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill={GOLD_BG} /><path d="M20 14v4l3 3M12 20a8 8 0 1116 0 8 8 0 01-16 0z" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  <svg key="5" className="w-10 h-10" fill="none" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill={GOLD_BG} /><path d="M12 20h16M20 12v16" stroke={GOLD} strokeWidth="2" strokeLinecap="round" /></svg>,
  <svg key="6" className="w-10 h-10" fill="none" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill={GOLD_BG} /><path d="M14 20a6 6 0 0112 0" stroke={GOLD} strokeWidth="2" strokeLinecap="round" /><circle cx="20" cy="26" r="2" fill={GOLD} /></svg>,
  <svg key="7" className="w-10 h-10" fill="none" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill={GOLD_BG} /><path d="M16 28l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2M20 14h6a2 2 0 012 2v2M20 14l-4 4m4-4l4 4" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
];

const { plans } = aliceContent;

export default function PlanCards() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-20 sm:py-28" style={{ background: PF_TOKENS.bg }}>
      <div className="text-center max-w-[800px] mx-auto px-4 sm:px-6 mb-14">
        <motion.h2
          className="text-[40px] sm:text-[48px] lg:text-[56px] font-medium leading-[1.14] mb-4"
          style={{ color: PF_TOKENS.text, letterSpacing: '-0.02em' }}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING, delay: 0 }}
        >
          {plans.title}
        </motion.h2>
        {plans.subtitle && (
          <motion.p
            className="text-base leading-6 max-w-[640px] mx-auto"
            style={{ color: PF_TOKENS.textMuted }}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING, delay: 0.1 }}
          >
            {plans.subtitle}
          </motion.p>
        )}
      </div>

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Gridlines (Reflect) */}
          <div className="absolute inset-0 pointer-events-none hidden lg:flex justify-between" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-full w-[1px]"
                style={{
                  background:
                    i % 2 === 0
                      ? 'linear-gradient(180deg, rgba(0,0,0,0.08) -0.89%, rgba(0,0,0,0) 100%)'
                      : 'linear-gradient(0deg, rgba(0,0,0,0.08) -0.89%, rgba(0,0,0,0) 100%)',
                }}
              />
            ))}
          </div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] hidden lg:block"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0) -0.89%, rgba(0,0,0,0.06) 24.33%, rgba(0,0,0,0.06) 49.55%, rgba(0,0,0,0.06) 74.78%, rgba(0,0,0,0) 100%)',
            }}
          />

          {plans.cards.map((card, i) => (
            <motion.div
              key={card.title}
              className="group relative overflow-hidden px-6 sm:px-8 py-6 sm:py-9"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING, delay: 0.05 * i }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                style={{
                  background:
                    i < 4
                      ? 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.03) 100%)'
                      : 'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.03) 100%)',
                  transition: '.45s cubic-bezier(.6,.6,0,1) opacity',
                }}
              />
              <div className="relative">
                <div className="mb-5">{ICONS[i % ICONS.length]}</div>
                <h3
                  className="text-base font-medium mb-1"
                  style={{ color: PF_TOKENS.text }}
                >
                  {card.title}
                </h3>
                {card.description && (
                  <p
                    className="text-base leading-6"
                    style={{ color: PF_TOKENS.textMuted }}
                  >
                    {card.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
