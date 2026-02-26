'use client';

import { Check } from 'lucide-react';
import { PF_TOKENS } from '../content/pfDesignTokens';

export interface TabelaValor {
  id: string | number;
  nomePlano: string;
  seguradora: string;
  logoSeguradora: string;
  valorMensal: string;
  beneficios: string[];
  destaque?: boolean;
}

interface PlanosCarouselProps {
  planos: TabelaValor[];
}

/** Logo com filtro branco (oficial da operadora em branco) */
function LogoOperadora({ src, alt, size }: { src: string; alt: string; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="object-contain w-full h-full select-none"
      style={{ filter: 'brightness(0) invert(1)' }}
      loading="lazy"
      draggable={false}
    />
  );
}

export default function PlanosCarousel({ planos }: PlanosCarouselProps) {
  /** Título: "Planos a partir de" + dourado mais claro em degradê */
  const titleGoldGradient = 'linear-gradient(105deg, #FBF0c4 0%, #F6E05E 25%, #E8D24A 50%, #D4AF37 75%, #C19B2E 100%)';

  if (!planos?.length) {
    return (
      <section className="w-full py-24 bg-black overflow-hidden flex flex-col gap-12">
        <div className="text-center px-6">
          <h2 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-4">
            Planos a partir de{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: titleGoldGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
              valores otimizados
            </span>
          </h2>
          <p className="text-slate-400 text-lg">Em breve: os melhores custos-benefícios mapeados pelo nosso sistema.</p>
        </div>
      </section>
    );
  }

  const duplicatedPlanos = [...planos, ...planos, ...planos];

  return (
    <section className="w-full py-24 bg-black overflow-hidden flex flex-col gap-12">
      <div className="text-center px-6">
        <h2 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-4">
          Planos a partir de{' '}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: titleGoldGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
            valores otimizados
          </span>
        </h2>
        <p className="text-slate-400 text-lg">Os melhores custos-benefícios mapeados pelo nosso sistema.</p>
      </div>

      <div className="relative w-full flex overflow-x-hidden group [mask-image:_linear-gradient(to_right,transparent_0,_black_100px,_black_calc(100%-100px),transparent_100%)]">
        <div className="flex w-max shrink-0 gap-6 py-10 animate-marquee-pf group-hover:[animation-play-state:paused]">
          {duplicatedPlanos.map((plano, index) => (
            <div
              key={`${plano.id}-${index}`}
              className="relative flex flex-col w-[300px] md:w-[340px] shrink-0 rounded-[2rem] bg-white/[0.04] border border-white/10 p-8 transition-all duration-500 hover:-translate-y-3 hover:bg-white/[0.06] hover:border-white/20 backdrop-blur-xl cursor-pointer"
              style={{
                boxShadow: 'none',
              }}
            >
              {plano.destaque && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider"
                  style={{
                    background: `linear-gradient(90deg, ${PF_TOKENS.gradientStart} 0%, ${PF_TOKENS.primary} 50%, ${PF_TOKENS.gradientEnd} 100%)`,
                  }}
                >
                  Mais Buscado
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10 p-1 shrink-0 flex items-center justify-center">
                  <LogoOperadora src={plano.logoSeguradora} alt={plano.seguradora} size={40} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-400 font-medium truncate">{plano.seguradora}</p>
                  <h3 className="text-xl font-semibold text-white leading-tight truncate">{plano.nomePlano}</h3>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-400 mb-1">A partir de</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-medium" style={{ color: PF_TOKENS.primary }}>R$</span>
                  <span className="text-4xl font-bold text-white tracking-tight">{plano.valorMensal}</span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-grow">
                {plano.beneficios.map((beneficio, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="w-5 h-5 shrink-0" style={{ color: PF_TOKENS.primary }} strokeWidth={2} />
                    <span className="line-clamp-2">{beneficio}</span>
                  </li>
                ))}
              </ul>

              <a
                href="https://wa.me/5521988179407?text=Olá!%20Quero%20este%20plano%20-%20gostaria%20de%20uma%20cotação%20de%20plano%20de%20saúde%20para%20pessoa%20física."
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 rounded-xl border text-white font-medium text-center transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = PF_TOKENS.primary;
                  e.currentTarget.style.borderColor = PF_TOKENS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }}
              >
                Quero este plano
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
