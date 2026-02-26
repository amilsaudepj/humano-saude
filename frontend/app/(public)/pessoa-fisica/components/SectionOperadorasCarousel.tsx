'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 120 };
/** Alice: speed 0.1 no script-especialistas */
const PARALLAX_SPEED = 0.1;

/** Cores estilo Alice: offwhite / offmagenta (lavanda) para o wrp do card */
const CARD_WRP_BG = '#EFEAF2';
const CARD_WRP_BG_ALT = 'rgba(184, 148, 31, 0.08)';

const { operadorasCarousel } = pfPageContent;

/** Card no estilo Alice: card-especialistas = [especialista-pic 140px | especialista-wrp 1fr], height 8rem */
function Card({
  title,
  description,
  accent,
}: { title: string; description: string; accent: 'offwhite' | 'offmagenta' }) {
  const wrpBg = accent === 'offmagenta' ? CARD_WRP_BG : CARD_WRP_BG_ALT;
  return (
    <div
      className="card-especialistas flex flex-none overflow-hidden rounded-xl border border-black/[0.06]"
      style={{
        height: '8rem',
        width: '280px',
        maxWidth: 'calc(140px + 20rem)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* especialista-pic: borda esquerda arredondada, largura fixa (Alice 140px; menor = 80px) */}
      <div
        className="especialista-pic flex flex-shrink-0 items-center justify-center rounded-l-xl"
        style={{ width: '80px', background: PF_TOKENS.primarySoft }}
      >
        <Check className="w-5 h-5" style={{ color: PF_TOKENS.primary }} strokeWidth={2} />
      </div>
      {/* especialista-wrp: borda direita arredondada, padding, flex column center (Alice) */}
      <div
        className="especialista-wrp flex flex-1 flex-col justify-center rounded-r-xl px-4 py-2 text-left"
        style={{
          background: wrpBg,
          gridColumnGap: '4px',
          gridRowGap: '4px',
        }}
      >
        <div className="font-size-xl font-semibold leading-tight text-sm" style={{ color: PF_TOKENS.text }}>
          {title}
        </div>
        <div className="font-size-xs leading-snug text-xs line-clamp-2" style={{ color: PF_TOKENS.textMuted }}>
          {description}
        </div>
      </div>
    </div>
  );
}

export default function SectionOperadorasCarousel() {
  const ref = useRef<HTMLElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  /** Parallax igual Alice: scrollPosition = pageYOffset - section.offsetTop; linhaUm += speed; linhaDois -= speed */
  useEffect(() => {
    const section = ref.current;
    const linhaUm = row1Ref.current;
    const linhaDois = row2Ref.current;
    if (!section || !linhaUm || !linhaDois) return;

    const onScroll = () => {
      if (!isIntersecting) return;
      const scrollPosition = window.pageYOffset - section.offsetTop;
      linhaUm.style.transform = `translateX(${scrollPosition * PARALLAX_SPEED}px)`;
      linhaDois.style.transform = `translateX(${-scrollPosition * PARALLAX_SPEED}px)`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isIntersecting]);

  /** IntersectionObserver como na Alice: threshold 0.5 para ativar parallax */
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsIntersecting(entry.isIntersecting));
      },
      { threshold: 0.5 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const cards = operadorasCarousel.cards;
  const row1Cards = cards.slice(0, 4);
  const row2Cards = cards.slice(4, 6);

  return (
    <section
      ref={ref}
      id="como-funciona"
      className="s-especialistas relative py-12 sm:py-16"
      style={{ background: PF_TOKENS.bg }}
    >
      <div className="padding-global max-w-6xl mx-auto px-4 sm:px-6">
        {/* c-especialistas: padding 80px 0, border-radius, bg branco (Alice) */}
        <div
          className="c-especialistas flex flex-col rounded-2xl sm:rounded-3xl border py-10 sm:py-16 px-4 sm:px-6"
          style={{
            background: PF_TOKENS.bg,
            borderColor: PF_TOKENS.border,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          {/* especialistas-title text-align-center mb-5rem */}
          <motion.div
            className="especialistas-title text-center mb-8 sm:mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING, delay: 0 }}
          >
            <h2 className="heading-2 text-2xl sm:text-3xl lg:text-4xl font-medium leading-tight mb-4" style={{ color: PF_TOKENS.text, letterSpacing: '-0.02em' }}>
              {operadorasCarousel.title}
            </h2>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: PF_TOKENS.textMuted }}>
              {operadorasCarousel.subtitle}
            </p>
          </motion.div>

          {/* m-wrapper mb-1rem + m-cards-wrapper linha-um (overflow hidden, parallax) */}
          <div className="m-wrapper mb-4 overflow-x-hidden">
            <div
              ref={row1Ref}
              className="m-cards-wrapper linha-um flex flex-row flex-none items-center gap-4 w-max pl-4"
              style={{ transition: 'transform 0.1s ease-out', willChange: 'transform' }}
            >
              {[...row1Cards, ...row1Cards].map((card, i) => (
                <Card
                  key={`r1-${i}`}
                  title={card.title}
                  description={card.description}
                  accent={i % 2 === 0 ? 'offwhite' : 'offmagenta'}
                />
              ))}
            </div>
          </div>
          <div className="m-wrapper overflow-x-hidden">
            <div
              ref={row2Ref}
              className="m-cards-wrapper linha-dois flex flex-row flex-none items-center justify-end gap-4 w-max pr-4 ml-auto"
              style={{ transition: 'transform 0.1s ease-out', willChange: 'transform' }}
            >
              {[...row2Cards, ...row2Cards].map((card, i) => (
                <Card
                  key={`r2-${i}`}
                  title={card.title}
                  description={card.description}
                  accent={i % 2 === 0 ? 'offmagenta' : 'offwhite'}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
