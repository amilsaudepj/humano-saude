'use client';

import { ArrowRight } from 'lucide-react';

/**
 * Hero Section: IDENTIDADE VISUAL da Imagem 1 (ClonewebX - Softlite)
 * + LAYOUT/POSICIONAMENTO da Imagem 2 (Plano de Saúde ref)
 *
 * - Cores, tipografia, botões, badges e gradiente = exatos da Imagem 1
 * - Container ~1200px, título deslocado à direita, CTAs centralizados lado a lado = Imagem 2
 */

// === Identidade visual Imagem 1 (ClonewebX) ===
const COLORS = {
  bg: '#F5F5F5',
  pillBg: '#E5E5E5',
  text: '#0a0a0a',
  textMuted: '#525252',
  border: '#171717',
  buttonPrimaryBg: '#0a0a0a',
  buttonPrimaryText: '#F5F5F5',
  gradientStart: '#3B82F6',
  gradientEnd: '#8B5CF6',
  trophy: '#EAB308',
} as const;

const GRADIENT_HIGHLIGHT = `linear-gradient(90deg, ${COLORS.gradientStart} 0%, ${COLORS.gradientEnd} 100%)`;

export default function HeroSectionClonewebXLayout() {
  return (
    <section
      className="relative min-h-[100vh] flex flex-col justify-center"
      style={{ background: COLORS.bg }}
    >
      {/* Container: max-width ~1200px, centralizado (layout ref Img 2) */}
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-8 lg:gap-6 xl:gap-8 items-center">
          {/* Coluna esquerda: título deslocado à direita (margin-left ~10–15%) */}
          <div className="min-w-0 lg:pl-[10%]">
            {/* Pill – estilo exato Imagem 1 */}
            <div
              className="inline-block rounded-[100px] px-4 py-2 mb-5 text-sm font-medium"
              style={{
                background: COLORS.pillBg,
                color: COLORS.textMuted,
              }}
            >
              ClonewebX - Softlite.io
            </div>

            {/* Título – conteúdo e estilo visual Imagem 1 */}
            <h1
              className="text-[32px] sm:text-[42px] lg:text-[52px] xl:text-[58px] font-bold leading-[1.15] mb-5 text-left"
              style={{ color: COLORS.text, letterSpacing: '-0.02em' }}
            >
              Clone websites to your Page Builders in{' '}
              <span
                className="inline-block px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-white"
                style={{ background: GRADIENT_HIGHLIGHT }}
              >
                minutes with AI
              </span>
            </h1>

            {/* Subtítulo – conteúdo e estilo Imagem 1 */}
            <p
              className="text-base sm:text-lg leading-7 text-left max-w-2xl"
              style={{ color: COLORS.textMuted }}
            >
              Supported Page Builders: Elementor, Webflow, Bricks, Breakdance, Gutenberg, Divi 5
            </p>
          </div>

          {/* Coluna direita: trust + CTAs centralizados lado a lado (layout ref) */}
          <div className="flex flex-col items-start lg:items-end gap-6 w-full lg:w-auto shrink-0">
            {/* Product Hunt badge – visual exato Imagem 1 */}
            <div
              className="inline-flex flex-col items-start rounded-lg border px-3 py-2"
              style={{ borderColor: COLORS.border }}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: COLORS.text }}>
                PRODUCT HUNT SAAS
              </span>
              <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: COLORS.text }}>
                <TrophyIcon className="w-4 h-4" style={{ color: COLORS.trophy }} />
                #3 Product of the Week
              </span>
            </div>

            {/* Trusted by 40k – avatares + texto, estilo Imagem 1 */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#F5F5F5] bg-gray-300"
                    style={{ zIndex: 5 - i }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium" style={{ color: COLORS.textMuted }}>
                Trusted by 40.000+ users
              </span>
            </div>

            {/* Dois CTAs lado a lado, centralizados (gap 20–30px), estilos idênticos Imagem 1 */}
            <div className="flex flex-row flex-wrap gap-5 sm:gap-6 w-full sm:w-auto">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border-2 transition-colors hover:bg-gray-100"
                style={{
                  color: COLORS.text,
                  borderColor: COLORS.border,
                  background: '#FFFFFF',
                }}
              >
                Go to app
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
                style={{
                  background: COLORS.buttonPrimaryBg,
                  color: COLORS.buttonPrimaryText,
                }}
              >
                Buy it now
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrophyIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C10.9 2 10 2.9 10 4v.5c-2.6.3-4.5 2.4-4.5 5v.5c0 2.5 1.9 4.6 4.4 4.9-.6.9-1.5 1.6-2.5 2.1V19H6v2h12v-2h-3.5v-3.9c-1-.5-1.9-1.2-2.5-2.1 2.5-.3 4.4-2.4 4.4-4.9V10c0-2.6-1.9-4.7-4.5-5V4c0-1.1-.9-2-2-2zm-2 8.5V10c0-1.1.9-2 2-2s2 .9 2 2v.5c0 1.1-.9 2-2 2s-2-.9-2-2zm4.5 0c0-1.9-1.4-3.4-3.2-3.7v.2c.9.2 1.6 1 1.6 2v.5c0 .8-.5 1.5-1.2 1.8.8.4 1.4 1.2 1.4 2.1v.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5v-.5c0-.9.6-1.7 1.4-2.1-.7-.3-1.2-1-1.2-1.8v-.5c0-1 .7-1.8 1.6-2v-.2c-1.8.3-3.2 1.8-3.2 3.7z" />
    </svg>
  );
}
