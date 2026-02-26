'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Play } from 'lucide-react';
import { pfPageContent } from '../content/pfPageContent';
import { PF_TOKENS } from '../content/pfDesignTokens';
import ReajusteAnimatedCard from './ReajusteAnimatedCard';
import CoparticipacaoCard from './CoparticipacaoCard';
import FaixaEtariaCard from './FaixaEtariaCard';
import RedeCredenciadaCard from './RedeCredenciadaCard';

const SPRING = { type: 'spring' as const, damping: 24, stiffness: 260 };
const { detailsMatter, stickyScrollBlocks } = pfPageContent;

/**
 * Área de mídia estilo GIF/vídeo: placeholder animado (shimmer) até inserir mídia real.
 * Cena descrita em scene para a11y e para produção futura.
 */
function BlockMediaPlaceholder({
  id,
  scene,
  index,
}: {
  id: string;
  scene: string;
  index: number;
}) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl"
      aria-label={scene}
    >
      {/* Fundo com shimmer animado (efeito “GIF carregando”) */}
      <div
        className="absolute inset-0 opacity-90 animate-shimmer-pf"
        style={{
          background: `linear-gradient(110deg, ${PF_TOKENS.bgAlt} 0%, ${PF_TOKENS.primarySoft} 25%, ${PF_TOKENS.bgAlt} 50%, ${PF_TOKENS.primarySoft} 75%, ${PF_TOKENS.bgAlt} 100%)`,
          backgroundSize: '200% 100%',
        }}
      />
      {/* Ícone “play” / mídia para reforçar que é área de vídeo/GIF */}
      <motion.div
        className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white/90"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
      >
        <Play className="h-4 w-4 fill-current" aria-hidden />
      </motion.div>
    </div>
  );
}

/**
 * Seção com efeito Sticky Scroll: coluna esquerda fixa, direita com 12 blocos
 * no estilo card (referência Family) + área para GIF/vídeo animado. Texto à esquerda centraliza na viewport ao rolar.
 */
export default function SectionStickyScroll() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      id="detalhes"
      className="relative py-16 sm:py-24 lg:py-28"
      style={{ background: PF_TOKENS.bg }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 lg:items-start">
          {/* Coluna FIXA: título + subtítulo centralizados na viewport ao rolar */}
          <div
            className="lg:sticky lg:top-1/2 lg:-translate-y-1/2 self-start"
            style={{ isolation: 'isolate' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING, delay: 0.1 }}
            >
              <h2
                className="text-2xl sm:text-3xl lg:text-[34px] font-bold leading-snug mb-3"
                style={{ color: PF_TOKENS.text, letterSpacing: '-0.02em' }}
              >
                {detailsMatter.title}
              </h2>
              <p
                className="text-base sm:text-lg font-medium leading-snug max-w-lg"
                style={{ color: PF_TOKENS.textMuted }}
              >
                {detailsMatter.subtitle}
              </p>
            </motion.div>
          </div>

          {/* Coluna que ROLA: card só com SVG/mídia; título e descrição fora (formato referência) */}
          <div className="flex flex-col gap-10 sm:gap-12">
            {stickyScrollBlocks.map((block, i) => (
              <motion.article
                key={block.id}
                className="flex flex-col gap-5"
                initial={{ opacity: 0, y: 32 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...SPRING, delay: 0.08 + i * 0.06 }}
              >
                {/* Card: estilo Figma – cantos suaves, sombra leve, borda discreta */}
                <div
                  className="aspect-[400/150] w-full max-w-md overflow-hidden rounded-[20px] border border-neutral-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  {block.id === '01' && <ReajusteAnimatedCard />}
                  {block.id === '02' && <CoparticipacaoCard />}
                  {block.id === '03' && <FaixaEtariaCard />}
                  {block.id === '04' && <RedeCredenciadaCard />}
                </div>
                {/* Título e descrição: hierarquia clara, estilo referência */}
                <div className="max-w-xl">
                  <h3 className="mb-2 flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ background: PF_TOKENS.primary }}
                    >
                      {block.id}
                    </span>
                    <span className="font-semibold text-neutral-800 text-lg sm:text-xl tracking-tight">
                      {block.title}
                    </span>
                  </h3>
                  <p
                    className="max-w-lg break-words whitespace-pre-line pl-10 text-[15px] sm:text-base text-neutral-500 leading-relaxed tracking-wide"
                    style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
                  >
                    {block.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
