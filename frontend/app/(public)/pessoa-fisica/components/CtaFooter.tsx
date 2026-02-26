'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 120 };

const CTA_HREF =
  'https://wa.me/5521988179407?text=Olá!%20Gostaria%20de%20uma%20cotação%20de%20plano%20de%20saúde%20para%20pessoa%20física.';

const { footer } = pfPageContent;

export default function CtaFooter() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <footer
      ref={ref}
      className="relative py-24 sm:py-32 overflow-hidden"
      style={{ background: PF_TOKENS.bg }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] blur-[160px] opacity-[0.07]"
          style={{ background: `radial-gradient(circle, ${PF_TOKENS.primary} 0%, transparent 60%)` }}
        />
      </div>

      <div
        className="absolute top-0 left-0 w-full h-[1px]"
        style={{
          background:
            'radial-gradient(62.87% 100% at 50% 0%, rgba(0, 0, 0, 0.06) 0%, transparent 100%)',
        }}
      />

      <div className="relative z-[1] max-w-[680px] mx-auto text-center px-4 sm:px-6">
        <motion.h2
          className="text-[40px] sm:text-[48px] lg:text-[56px] font-medium leading-[1.14] mb-5"
          style={{ color: PF_TOKENS.text, letterSpacing: '-0.02em' }}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING, delay: 0 }}
        >
          {footer.title}
        </motion.h2>

        {footer.subtitle && (
          <motion.p
            className="text-lg leading-7 mb-10 max-w-[520px] mx-auto"
            style={{ color: PF_TOKENS.textMuted }}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING, delay: 0.1 }}
          >
            {footer.subtitle}
          </motion.p>
        )}

        <motion.a
          href={CTA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-lg text-base font-medium cursor-pointer"
          style={{
            color: PF_TOKENS.text,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${PF_TOKENS.primaryMuted} 0%, transparent 100%), linear-gradient(0deg, ${PF_TOKENS.primaryMuted}, ${PF_TOKENS.primaryMuted})`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              padding: '1px',
              borderRadius: 'inherit',
            }}
          />
          <span
            className="absolute inset-0 rounded-lg -z-[1]"
            style={{
              background: `linear-gradient(180deg, ${PF_TOKENS.primarySoft} 0%, rgba(170,119,28,0.06) 100%), rgba(255,255,255,0.98)`,
            }}
          />
          <span
            className="absolute inset-0 rounded-lg -z-[1] opacity-0 group-hover:opacity-100"
            style={{
              background: `linear-gradient(180deg, ${PF_TOKENS.primaryMuted} 0%, ${PF_TOKENS.primarySoft} 100%), rgba(255,255,255,0.99)`,
              transition: '.2s opacity cubic-bezier(.6,.6,0,1)',
            }}
          />
          <span
            className="absolute -inset-2 rounded-xl -z-[2] opacity-60 blur-xl"
            style={{
              background: `linear-gradient(135deg, ${PF_TOKENS.glow} 0%, ${PF_TOKENS.primarySoft} 100%)`,
            }}
          />
          {footer.ctaLabel}
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
          </svg>
        </motion.a>
      </div>

      <div className="relative z-[1] mt-20 pt-8 max-w-[1200px] mx-auto px-4 sm:px-6">
        <div
          className="absolute top-0 left-0 w-full h-[1px]"
          style={{
            background:
              'radial-gradient(62.87% 100% at 50% 0%, rgba(0,0,0,0.06) 0%, transparent 100%)',
          }}
        />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logos/LOGO 1 SEM FUNDO.png"
              alt="Humano Saúde"
              width={100}
              height={32}
              className="h-7 w-auto opacity-60"
            />
          </div>
          {footer.disclaimer && (
            <p
              className="text-xs"
              style={{ color: PF_TOKENS.textCaption }}
            >
              {footer.disclaimer}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
