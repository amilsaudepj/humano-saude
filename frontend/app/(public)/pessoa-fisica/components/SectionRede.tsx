'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';

const CTA_HREF =
  'https://wa.me/5521988179407?text=Olá!%20Quero%20saber%20quais%20operadoras%20vocês%20trabalham%20para%20plano%20pessoa%20física.';

/** Hospitais reais do projeto com ângulo para posição radial (viewBox 0 0 100 100) */
const HOSPITAIS_REDE = [
  { nome: 'Copa D\'Or', url: '/images/hospitais/hospital copa dor.jpg', angle: 0 },
  { nome: 'Samaritano Barra', url: '/images/hospitais/hospital samaritano barra.jpg', angle: 60 },
  { nome: 'Barra D\'Or', url: '/images/hospitais/hospital barra dor .jpg', angle: 120 },
  { nome: 'Pró-Cardíaco', url: '/images/hospitais/hospital pro cardiaco.png', angle: 180 },
  { nome: 'São Vicente Gávea', url: '/images/hospitais/hospital sao vicente gavea.jpg', angle: 240 },
  { nome: 'Quinta D\'Or', url: '/images/hospitais/hospital quinta dor.jpg', angle: 300 },
];

const RADIUS = 38; // % do centro aos nós (viewBox 0 0 100 100)

/** Coordenadas (x, y) em % para cada hospital – usadas no SVG e nos nós */
function getNodeCoords(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const x = 50 + RADIUS * Math.cos(rad);
  const y = 50 + RADIUS * Math.sin(rad);
  return { x, y };
}

const { rede } = pfPageContent;

/** Seção rede: destaque preto (igual outras seções), não dourado */
const REDE_ACCENT = '#1a1a1a';
const REDE_ACCENT_MUTED = 'rgba(0, 0, 0, 0.2)';

/** Variantes para o container dos nós (cascata) */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.5,
      staggerChildren: 0.12,
    },
  },
};

/** Pop dos ícones dos hospitais */
const popVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 15 },
  },
};

/** Linhas desenhando do centro para as pontas (pathLength) */
const lineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 0.7,
    transition: { duration: 0.7, ease: 'easeOut' as const },
  },
};

export default function SectionRede() {
  const ref = useRef<HTMLElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const diagramInView = useInView(diagramRef, { once: true, margin: '-50px' });

  return (
    <section
      ref={ref}
      id="rede"
      className="relative py-16 sm:py-24 lg:py-28"
      style={{ background: PF_TOKENS.bg }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Coluna texto */}
          <motion.div
            className="order-2 lg:order-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', damping: 22, stiffness: 120, delay: 0.1 }}
          >
            <h2
              className="text-3xl sm:text-4xl lg:text-[44px] font-medium leading-tight mb-6"
              style={{ color: PF_TOKENS.text, letterSpacing: '-0.02em' }}
            >
              {rede.title}
            </h2>
            <p
              className="text-lg sm:text-xl leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0"
              style={{ color: PF_TOKENS.textMuted }}
            >
              {rede.subtitle}
            </p>
            <motion.a
              href={CTA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border cursor-pointer"
              style={{
                borderColor: REDE_ACCENT_MUTED,
                color: '#fff',
                background: REDE_ACCENT,
                transition: '.45s cubic-bezier(.6,.6,0,1)',
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#000';
                e.currentTarget.style.borderColor = REDE_ACCENT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = REDE_ACCENT;
                e.currentTarget.style.borderColor = REDE_ACCENT_MUTED;
              }}
            >
              {rede.ctaLabel}
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </motion.a>
          </motion.div>

          {/* Coluna: diagrama de rede – logo pulsa, linhas desenham, nós em cascata */}
          <motion.div
            ref={diagramRef}
            className="order-1 lg:order-2 relative"
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', damping: 22, stiffness: 120, delay: 0.2 }}
          >
            <motion.div
              className="relative w-full max-w-2xl mx-auto aspect-[4/3] flex items-center justify-center p-6 rounded-2xl overflow-hidden bg-white"
              style={{
                border: `1px solid ${PF_TOKENS.border}`,
                boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.12)',
                minHeight: 320,
              }}
            >
              {/* 1. SVG com linhas animadas (pathLength = desenho do centro para a ponta) */}
              <motion.svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                initial="hidden"
                animate={diagramInView ? 'visible' : 'hidden'}
                viewport={{ once: true, margin: '-50px' }}
              >
                <defs>
                  <linearGradient id="lineGradRede" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={REDE_ACCENT} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={REDE_ACCENT} stopOpacity="0.08" />
                  </linearGradient>
                </defs>
                {HOSPITAIS_REDE.map((h, i) => {
                  const { x, y } = getNodeCoords(h.angle);
                  return (
                    <motion.path
                      key={`line-${h.nome}`}
                      d={`M 50 50 L ${x} ${y}`}
                      fill="none"
                      stroke="url(#lineGradRede)"
                      strokeWidth="0.5"
                      variants={lineVariants}
                      transition={{ delay: 0.2 + i * 0.06, duration: 0.7, ease: 'easeOut' }}
                    />
                  );
                })}
              </motion.svg>

              {/* 2. Logo central Humano Saúde – pulsa primeiro */}
              <motion.div
                className="relative z-20 flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-white border shadow-[0_0_40px_rgba(0,0,0,0.08)]"
                style={{ borderColor: REDE_ACCENT_MUTED }}
                initial={{ scale: 0, opacity: 0 }}
                animate={diagramInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <Image
                  src="/images/logos/logo-humano-saude-dourado.png"
                  alt="Humano Saúde"
                  width={90}
                  height={90}
                  className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                />
              </motion.div>

              {/* 3. Nós dos hospitais – âncora no centro com -translate-x-1/2 -translate-y-1/2, cascata */}
              <motion.div
                className="absolute inset-0"
                variants={containerVariants}
                initial="hidden"
                animate={diagramInView ? 'visible' : 'hidden'}
                viewport={{ once: true }}
              >
                {HOSPITAIS_REDE.map((h, i) => {
                  const { x, y } = getNodeCoords(h.angle);
                  return (
                    <motion.div
                      key={`node-${h.nome}`}
                      variants={popVariants}
                      className="absolute z-10 flex flex-col items-center gap-2 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <div
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 shadow-lg ring-2 ring-white/10 bg-[#0B1120]"
                        style={{ borderColor: REDE_ACCENT_MUTED }}
                      >
                        <Image
                          src={h.url}
                          alt={h.nome}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span
                        className="text-[10px] sm:text-xs font-semibold text-center max-w-[80px] leading-tight px-2 py-1 rounded-md shadow-sm backdrop-blur-sm"
                        style={{ color: PF_TOKENS.text, background: 'rgba(255,255,255,0.95)' }}
                      >
                        {h.nome}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
