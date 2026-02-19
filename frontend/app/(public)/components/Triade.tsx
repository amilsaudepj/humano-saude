'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const triadSteps = [
  {
    num: '01',
    title: 'Analisar',
    tag: 'Diagnóstico técnico',
    desc: 'Mapeamos sua fatura atual para expor cobranças indevidas, risco de reajuste e pontos de desperdício.',
    impact: 'Você ganha uma leitura objetiva de onde está perdendo margem hoje.',
    icon: (
      <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Assessorar',
    tag: 'Estratégia assistida',
    desc: 'Definimos a migração técnica com foco em rede hospitalar, cobertura e melhor equilíbrio financeiro.',
    impact: 'Sua decisão deixa de ser comercial e passa a ser baseada em evidência.',
    icon: (
      <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Acompanhar',
    tag: 'Gestão contínua',
    desc: 'Mantemos acompanhamento vitalício para prevenir distorções e blindar seu contrato contra reajustes abusivos.',
    impact: 'Economia recorrente e previsibilidade de custo para o RH e financeiro.',
    icon: (
      <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
];

const quickWins = [
  { label: 'Leitura técnica da fatura', value: 'Diagnóstico profundo' },
  { label: 'Decisão sem achismo', value: 'Estratégia baseada em dados' },
  { label: 'Controle de longo prazo', value: 'Gestão vitalícia do benefício' },
];

export default function Triade() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const activeIndex = useMemo(() => {
    const next = Math.floor((progress / 100) * triadSteps.length);
    return Math.max(0, Math.min(next, triadSteps.length - 1));
  }, [progress]);

  useEffect(() => {
    const updateProgress = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const marker = window.innerHeight * 0.68;
      const passed = marker - rect.top;
      const pct = Math.max(0, Math.min(passed / rect.height, 1)) * 100;

      setProgress(pct);
    };

    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        updateProgress();
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    updateProgress();

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <section id="metodo" className="relative isolate overflow-hidden bg-[#050505] py-20 text-center sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#B8941F]/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(184,148,31,0.16),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '58px 58px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <span className="mb-6 inline-block rounded-full border border-[#B8941F]/25 bg-[#B8941F]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[3px] text-[#D9B651]">
          Nosso método
        </span>
        <h2 className="mb-4 text-3xl font-black text-white md:text-4xl lg:text-5xl" style={{ fontFamily: 'Cinzel, serif' }}>
          A Tríade <span className="text-[#D9B651]">Humana</span>
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-[1.05rem] text-gray-300 sm:text-lg">
          Um fluxo simples de três etapas para reduzir custo, proteger cobertura e manter sua empresa no controle.
        </p>

        <div className="mx-auto mb-14 grid max-w-4xl gap-3 text-left sm:grid-cols-3">
          {quickWins.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-sm transition-all duration-300 hover:border-[#B8941F]/40 hover:bg-white/[0.05]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[2.6px] text-[#D9B651]">
                {item.value}
              </p>
              <p className="mt-1 text-base text-white/85">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
          <aside className="lg:sticky lg:top-24 lg:text-left">
            <div className="rounded-3xl border border-[#B8941F]/25 bg-gradient-to-b from-[#2b2109]/50 via-[#1a1407]/50 to-black/70 p-6 text-left shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[2.6px] text-[#D9B651]">Etapa em destaque</p>
              <div className="mt-4 inline-flex items-center rounded-full border border-[#D9B651]/35 bg-[#D9B651]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[2.3px] text-[#F7DA8B]">
                Passo {triadSteps[activeIndex].num}
              </div>
              <h3 className="mt-4 text-2xl font-bold text-white sm:text-[1.9rem]" style={{ fontFamily: 'Cinzel, serif' }}>
                {triadSteps[activeIndex].title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-gray-300">
                O painel à direita mostra o detalhe de cada fase sem repetição. Aqui você acompanha o progresso em tempo real.
              </p>

              <div className="mt-5 space-y-2.5">
                {triadSteps.map((step, index) => (
                  <div
                    key={step.num}
                    className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                      index === activeIndex
                        ? 'border-[#D9B651]/40 bg-[#D9B651]/12 text-[#F6D985]'
                        : 'border-white/10 bg-white/[0.02] text-gray-300'
                    }`}
                  >
                    <span className="font-bold tracking-[1.8px] uppercase text-[10px]">Passo {step.num}</span>
                    <p className="mt-0.5 text-base">{step.title}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#B8941F] via-[#E0BC58] to-[#B8941F] transition-all duration-500"
                  style={{ width: `${((activeIndex + 1) / triadSteps.length) * 100}%` }}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                {triadSteps.map((step, index) => (
                  <span
                    key={step.num}
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                      index <= activeIndex ? 'bg-[#D9B651]' : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>
          </aside>

          <div id="timeline-container" ref={containerRef} className="relative pb-2 pl-14 text-left sm:pl-20">
            <div className="absolute bottom-0 left-5 top-0 w-[2px] rounded-full bg-white/10 sm:left-8">
              <div
                className="w-full rounded-full bg-gradient-to-b from-[#E5C66A] via-[#B8941F] to-[#8A6A17] transition-all duration-300 ease-out"
                style={{ height: `${progress}%` }}
              />
            </div>

            <div className="space-y-8 sm:space-y-10">
              {triadSteps.map((step, index) => {
                const stepThreshold = (index / triadSteps.length) * 100;
                const isActive = progress >= stepThreshold || index <= activeIndex;
                const isCurrent = index === activeIndex;

                return (
                  <article key={step.num} className="relative group">
                    <div className="absolute -left-[2.6rem] top-7 flex items-center justify-center sm:-left-[3.3rem]">
                      <div
                        className={`absolute rounded-full transition-all duration-700 ${
                          isActive ? 'h-12 w-12 bg-[#D9B651]/20 shadow-[0_0_30px_rgba(184,148,31,0.4)]' : 'h-10 w-10 bg-transparent'
                        }`}
                      />
                      <div
                        className={`relative flex h-10 w-10 items-center justify-center rounded-full border text-white transition-all duration-500 sm:h-12 sm:w-12 ${
                          isActive
                            ? 'border-[#D9B651]/60 bg-gradient-to-br from-[#E3C56A] via-[#B8941F] to-[#8D6D1A] shadow-[0_8px_20px_rgba(184,148,31,0.35)]'
                            : 'border-white/20 bg-[#0e0e0e] text-white/40'
                        }`}
                      >
                        {step.icon}
                      </div>
                    </div>

                    <div
                      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 sm:p-7 ${
                        isActive
                          ? 'border-[#B8941F]/35 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-white/[0.03] opacity-100'
                          : 'border-white/10 bg-white/[0.02] opacity-70'
                      } ${isCurrent ? 'sm:-translate-y-1 sm:shadow-[0_20px_38px_rgba(0,0,0,0.35)]' : ''}`}
                    >
                      <div className="absolute right-4 top-4 text-[3.2rem] font-black leading-none text-white/[0.04]">
                        {step.num}
                      </div>

                      <div className="relative flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold tracking-[3px] ${isActive ? 'text-[#E7CA74]' : 'text-white/35'}`}>
                          PASSO {step.num}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[2px] ${
                            isActive
                              ? 'border-[#D9B651]/35 bg-[#D9B651]/15 text-[#F1D783]'
                              : 'border-white/15 bg-white/[0.04] text-white/45'
                          }`}
                        >
                          {step.tag}
                        </span>
                      </div>

                      <h3 className="relative mt-3 text-2xl font-bold text-white sm:text-[1.9rem]" style={{ fontFamily: 'Cinzel, serif' }}>
                        {step.title}
                      </h3>
                      <p className="relative mt-3 text-base leading-relaxed text-gray-300 sm:text-[1.06rem]">
                        {step.desc}
                      </p>

                      <div
                        className={`relative mt-5 rounded-xl border px-4 py-3 ${
                          isActive ? 'border-[#D9B651]/30 bg-[#D9B651]/10' : 'border-white/10 bg-white/[0.02]'
                        }`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[2.2px] text-[#E7CA74]">Resultado de negócio</p>
                        <p className="mt-1 text-base text-[#F5E0A5] sm:text-[1.03rem]">{step.impact}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-14 rounded-2xl border border-[#B8941F]/25 bg-gradient-to-r from-[#211806]/65 via-[#1b1407]/65 to-[#211806]/65 p-6 text-left backdrop-blur-sm sm:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-bold text-white sm:text-2xl">Quer aplicar a Tríade no seu contrato atual?</p>
              <p className="mt-1 text-sm text-gray-300 sm:text-base">
                Receba uma análise técnica e saiba onde reduzir custo sem comprometer sua rede de atendimento.
              </p>
            </div>
            <a
              href="https://wa.me/5521988179407?text=Olá!%20Quero%20implementar%20a%20Tríade%20Humana."
              className="inline-flex self-start items-center justify-center gap-3 whitespace-nowrap rounded-xl bg-[#B8941F] px-6 py-3 text-[11px] font-bold uppercase tracking-[2.2px] text-white transition-all hover:-translate-y-0.5 hover:bg-[#A07E18] hover:shadow-lg hover:shadow-[#B8941F]/25 sm:px-7 sm:text-sm sm:tracking-[2.6px]"
            >
              <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z" />
              </svg>
              Implementar método agora
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
