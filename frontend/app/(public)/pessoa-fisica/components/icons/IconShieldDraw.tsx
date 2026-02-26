'use client';

/**
 * Exemplo de ícone "premium" com animação de desenho (pathLength).
 * Para ícones assim: copie o SVG do lucide.dev (Copy SVG), cole aqui
 * e use motion.path com pathLength de 0 → 1. Não use o componente
 * lucide-react fechado para esse efeito — use o código bruto do SVG.
 *
 * Este SVG é o Shield Check do Lucide (lucide.dev/icons/shield-check).
 */
import { motion } from 'framer-motion';

const SPRING = { type: 'spring' as const, damping: 24, stiffness: 200 };

export default function IconShieldDraw({
  size = 48,
  color = 'currentColor',
  delay = 0,
}: {
  size?: number;
  color?: string;
  delay?: number;
}) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { delay, staggerChildren: 0.05 },
        },
      }}
    >
      <motion.path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: { ...SPRING, duration: 0.8 },
          },
        }}
      />
      <motion.path
        d="m9 12 2 2 4-4"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: { ...SPRING, duration: 0.4, delay: 0.3 },
          },
        }}
      />
    </motion.svg>
  );
}
