'use client';

import { motion } from 'framer-motion';

const SVG_BG = '#f8fafc';

/**
 * Fatura (esq.) → fatura escaneada com raio X + reduzindo (dir.).
 */
export default function ReajusteAnimatedCard() {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: SVG_BG }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="max-h-full max-w-full object-contain"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.04" floodColor="#000" />
          </filter>
          <linearGradient id="xray-scan" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
          <clipPath id="doc-clip">
            <rect x="32" y="48" width="46" height="54" rx="10" />
          </clipPath>
          <clipPath id="doc-right-clip">
            <rect x="178" y="42" width="52" height="66" rx="10" />
          </clipPath>
        </defs>
        <rect width="400" height="150" rx="16" fill={SVG_BG} />
        <g transform="translate(200,75) scale(1.18) translate(-132,-71)">
          {/* Esquerda da fatura: seta vermelha maior e com espaço (não colada) */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <path d="M8 88 L8 52 M4 58 L8 50 L12 58" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <text x="8" y="98" textAnchor="middle" fill="#b91c1c" fontFamily="system-ui, sans-serif" fontSize="7" fontWeight="600">
              reajuste
            </text>
          </motion.g>

          {/* Fatura: documento com scanner do topo ao fim */}
          <motion.g
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <rect x="32" y="48" width="46" height="54" rx="10" fill="#fff" stroke="#e2e8f0" strokeWidth="1" filter="url(#soft-shadow)" />
            <text x="55" y="58" textAnchor="middle" fill="#64748b" fontFamily="system-ui, sans-serif" fontSize="6" fontWeight="700" letterSpacing="0.05em">
              FATURA
            </text>
            <line x1="36" y1="62" x2="70" y2="62" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="36" y1="70" x2="68" y2="70" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="36" y1="78" x2="58" y2="78" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="36" y="86" width="22" height="4" rx="2" fill="#fef2f2" stroke="#fecaca" strokeWidth="0.6" />
            <g clipPath="url(#doc-clip)">
              <motion.rect
                x="32"
                y="48"
                width="46"
                height="4"
                rx="2"
                fill="#dc2626"
                opacity={0.4}
                animate={{ y: [48, 98] }}
                transition={{ repeat: Infinity, repeatType: 'loop', duration: 2.2, ease: 'easeInOut' }}
              />
            </g>
          </motion.g>

          {/* Seta conectora */}
          <motion.path
            d="M88 75 L158 75 M152 71 L158 75 L152 79"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          />

          {/* Direita: fatura escaneada com raio X + reduzindo ao lado */}
          <motion.g
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            {/* Fatura 2 (documento): linhas dentro do rect 178..230 */}
            <rect x="178" y="42" width="52" height="66" rx="10" fill="#fff" stroke="#e2e8f0" strokeWidth="1" filter="url(#soft-shadow)" />
            <text x="204" y="54" textAnchor="middle" fill="#64748b" fontFamily="system-ui, sans-serif" fontSize="6" fontWeight="700" letterSpacing="0.05em">
              FATURA
            </text>
            <line x1="184" y1="60" x2="224" y2="60" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="184" y1="68" x2="224" y2="68" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="184" y1="76" x2="218" y2="76" stroke="#e2e8f0" strokeWidth="0.8" />
            <rect x="184" y="84" width="24" height="5" rx="2" fill="#fef2f2" stroke="#fecaca" strokeWidth="0.6" />
            {/* Raio X: scan do topo ao fim da fatura (42 até 108) */}
            <g clipPath="url(#doc-right-clip)">
              <motion.rect
                x="178"
                y="42"
                width="52"
                height="5"
                rx="2"
                fill="#22d3ee"
                opacity={0.5}
                animate={{ y: [42, 103] }}
                transition={{ repeat: Infinity, repeatType: 'loop', duration: 2.2, ease: 'easeInOut' }}
              />
            </g>
            {/* Reduzindo: seta verde simples (traço + triângulo para baixo) */}
            <motion.g animate={{ y: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
              <path d="M266 58 L266 74 M263 71 L266 76 L269 71" stroke="#059669" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </motion.g>
            <text x="266" y="98" textAnchor="middle" fill="#047857" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="600">
              reduzindo
            </text>
          </motion.g>
        </g>
      </svg>
    </div>
  );
}
