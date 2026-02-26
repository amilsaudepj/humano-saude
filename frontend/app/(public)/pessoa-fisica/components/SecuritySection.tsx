'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';

const { security } = pfPageContent;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 100 },
  },
};

/** Gradiente para o destaque do título (dourado – Design System) */
const titleGradient = `linear-gradient(90deg, ${PF_TOKENS.primary} 0%, ${PF_TOKENS.primaryHover} 100%)`;

export default function SecuritySection() {
  return (
    <section className="relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden py-24 px-6" style={{ background: '#0B1120' }}>
      {/* 1. Background (gradiente + opcional: vídeo ou padrão sutil) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Padrão sutil tipo “dados” – sem vídeo para evitar 404; opcional: descomente e use src do seu vídeo */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${PF_TOKENS.primary} 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-15"
          style={{ background: PF_TOKENS.primary }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-[#0B1120]" />
      </div>

      {/* 2. Container principal (glassmorphism) */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-3xl p-10 md:p-16 rounded-[2rem] border shadow-[0_0_40px_rgba(0,0,0,0.4)]"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        {/* Ícone cadeado */}
        <motion.div
          variants={itemVariants}
          className="mb-8 p-4 rounded-2xl border"
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Lock className="w-10 h-10" style={{ color: PF_TOKENS.primary }} strokeWidth={1.5} />
        </motion.div>

        {/* Badge */}
        <motion.div
          variants={itemVariants}
          className="mb-6 px-4 py-1.5 rounded-full border text-sm font-medium tracking-wide uppercase"
          style={{
            borderColor: PF_TOKENS.primaryMuted,
            background: PF_TOKENS.primarySoft,
            color: PF_TOKENS.primary,
          }}
        >
          {security.tag}
        </motion.div>

        {/* Título com destaque em gradiente */}
        <motion.h2
          variants={itemVariants}
          className="text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-tight text-white"
        >
          {security.title}{' '}
          <br className="hidden md:block" />
          <span
            className="text-transparent bg-clip-text"
            style={{ background: titleGradient }}
          >
            nível institucional.
          </span>
        </motion.h2>

        {/* Descrição */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl leading-relaxed max-w-xl mx-auto mb-10 text-white/70"
        >
          {security.description}
        </motion.p>

        {/* CTA */}
        <motion.a
          href="#faq"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 rounded-full font-medium text-lg text-white transition-shadow"
          style={{
            background: PF_TOKENS.gradient,
            boxShadow: `0 0 20px ${PF_TOKENS.glowStrong}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 0 30px ${PF_TOKENS.glowStrong}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `0 0 20px ${PF_TOKENS.glowStrong}`;
          }}
        >
          Tire suas dúvidas
        </motion.a>
      </motion.div>
    </section>
  );
}
