'use client';

import { motion } from 'framer-motion';

const SVG_BG = '#f8fafc';

/**
 * Rede Credenciada: sua rede mudou? Planos com acesso aos melhores hospitais do RJ.
 */
export default function RedeCredenciadaCard() {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: SVG_BG }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="max-h-full max-w-full object-contain"
      >
        <rect width="400" height="150" rx="16" fill={SVG_BG} />
        <g transform="translate(200,75) scale(1.2) translate(-189,-75)">
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <circle cx="85" cy="55" r="18" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx="135" cy="75" r="18" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx="85" cy="95" r="18" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
            <path d="M103 55 L117 75 M103 95 L117 75" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
            <text x="85" y="122" textAnchor="middle" fill="#64748b" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="600">sua rede</text>
          </motion.g>
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <text x="175" y="78" textAnchor="middle" fill="#94a3b8" fontFamily="system-ui, sans-serif" fontSize="16" fontWeight="600">mudou?</text>
          </motion.g>
          <motion.g
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.35 }}
          >
            <rect x="218" y="35" width="82" height="80" rx="12" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
            <path d="M259 48 v-5 h16 v5 M252 48 h36 l5 10 v34 h-46 v-34 z M264 68 h8 M264 78 h8 M264 88 h8" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <motion.path
              d="M282 78 L287 83 L298 72"
              stroke="#059669"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            />
            <text x="259" y="118" textAnchor="middle" fill="#047857" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="600">melhores hospitais</text>
          </motion.g>
        </g>
      </svg>
    </div>
  );
}
