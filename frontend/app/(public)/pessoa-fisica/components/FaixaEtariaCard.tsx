'use client';

import { motion } from 'framer-motion';

const SVG_BG = '#f8fafc';

/** Aumento de faixa etária: alerta aniversário, travar salto de preço. */
export default function FaixaEtariaCard() {
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
        <g transform="translate(200,75) scale(1.18) translate(-204,-72)">
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <rect x="70" y="38" width="68" height="62" rx="8" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="70" y="38" width="68" height="18" rx="8" fill="#fef2f2" stroke="#fecaca" strokeWidth="0.8" />
            <text x="104" y="51" textAnchor="middle" fill="#b91c1c" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="700">ANIVERSÁRIO</text>
            <text x="104" y="82" textAnchor="middle" fill="#dc2626" fontFamily="system-ui, sans-serif" fontSize="24" fontWeight="800">44</text>
            <text x="104" y="98" textAnchor="middle" fill="#64748b" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="500">faixa etária</text>
          </motion.g>
          <motion.g initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <rect x="168" y="55" width="44" height="34" rx="6" fill="#fef3c7" stroke="#fcd34d" strokeWidth="0.8" />
            <circle cx="190" cy="68" r="5" fill="none" stroke="#d97706" strokeWidth="1.2" />
            <path d="M190 74 v10" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
            <text x="190" y="98" textAnchor="middle" fill="#b45309" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="600">travar</text>
          </motion.g>
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <rect x="238" y="45" width="110" height="54" rx="10" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="0.8" />
            <text x="293" y="72" textAnchor="middle" fill="#047857" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="700">sem salto</text>
            <text x="293" y="88" textAnchor="middle" fill="#059669" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="500">de preço</text>
          </motion.g>
        </g>
      </svg>
    </div>
  );
}
