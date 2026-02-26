'use client';

import { motion } from 'framer-motion';

const SVG_BG = '#f8fafc';

export default function CoparticipacaoCard() {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: SVG_BG }}>
      <svg width="100%" height="100%" viewBox="0 0 400 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-h-full max-w-full object-contain">
        <rect width="400" height="150" rx="16" fill={SVG_BG} />
        <g transform="translate(200,75) scale(1.2) translate(-180,-72)">
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <circle cx="100" cy="70" r="28" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx="93" cy="63" r="5" fill="#64748b" />
            <circle cx="107" cy="63" r="5" fill="#64748b" />
            <path d="M88 82 q12 5 24 0" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <text x="100" y="105" textAnchor="middle" fill="#64748b" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="600">quem não usa</text>
          </motion.g>
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <path d="M195 50 L195 75 M191 71 L195 77 L199 71" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </motion.g>
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <rect x="245" y="38" width="100" height="58" rx="10" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="0.8" />
            <text x="295" y="68" textAnchor="middle" fill="#047857" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="700">Coparticipação</text>
            <text x="295" y="84" textAnchor="middle" fill="#059669" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="500">inteligente</text>
          </motion.g>
        </g>
      </svg>
    </div>
  );
}
