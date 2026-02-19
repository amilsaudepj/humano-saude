'use client';

import { useEffect, useState } from 'react';

export default function AISimulator() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { id: 'step1', text: 'Identificando tabelas...', position: 'top-[18%] left-[8%]' },
    { id: 'step2', text: 'Analisando sinistralidade...', position: 'top-[28%] right-[10%]' },
    { id: 'step3', text: 'Varrendo mercado...', position: 'bottom-[22%] left-[15%]' },
    { id: 'step4', text: '✓ Economia detectada', position: 'top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2', isSuccess: true },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= steps.length - 1) {
          setTimeout(() => setActiveStep(0), 2000);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="ia" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center mb-24">
          
          {/* Texto */}
          <div className="lg:col-span-2 text-left">
            <span className="inline-block px-4 py-1.5 bg-[#B8941F]/10 text-[#B8941F] rounded-full text-xs font-bold uppercase tracking-[3px] mb-6 border border-[#B8941F]/20">
              Eficiência nos benefícios
            </span>
            <h3 className="text-4xl lg:text-5xl font-black text-black leading-[1.1] mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
              O fim do<br />
              <span className="text-[#B8941F]">custo ineficiente</span>
            </h3>
            <p className="text-lg text-gray-500 leading-relaxed mb-10">
              Nossa IA analisa em tempo real o mercado para identificar a{' '}
              <span className="text-[#B8941F] font-bold">migração técnica</span>{' '}
              ideal para sua empresa.
            </p>
            <a
              href="#calculadora"
              className="inline-flex items-center gap-3 bg-black hover:bg-gray-900 px-8 py-4 rounded-xl text-sm uppercase tracking-widest font-bold text-white transition-all hover:-translate-y-0.5 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H12.75v-.008zm0 2.25h.008v.008H12.75v-.008zm2.25-6.75h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              Simular minha economia
            </a>
          </div>

          {/* Simulador */}
          <div className="lg:col-span-3">
            <div className="relative bg-black h-[420px] lg:h-[480px] rounded-3xl border border-[#B8941F]/15 overflow-hidden shadow-2xl shadow-black/30">
              
              {/* Glow de fundo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#B8941F]/5 rounded-full blur-3xl pointer-events-none" />

              {/* Logo Central com anéis */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[5]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-28 h-28 border border-[#B8941F]/40 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-48 h-48 border border-[#B8941F]/15 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
                  <div className="absolute w-72 h-72 border border-[#B8941F]/8 rounded-full" />
                </div>
                <img
                  src="/images/logos/LOGO 1 SEM FUNDO.png"
                  alt="Humano Saúde IA"
                  className="w-20 h-auto relative z-[5] opacity-90 brightness-200"
                />
              </div>

              {/* Scan lines */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)' }} />

              {/* Data Points */}
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className={`absolute ${step.position} px-4 py-2.5 rounded-lg transition-all duration-500 backdrop-blur-md z-10 ${
                    step.isSuccess
                      ? 'bg-[#B8941F] text-black font-bold text-sm px-6 py-3 shadow-lg shadow-[#B8941F]/30'
                      : 'bg-white/5 border border-[#B8941F]/20 text-[#B8941F]/80 text-xs font-medium tracking-wide'
                  } ${
                    activeStep >= i ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  }`}
                >
                  {step.text}
                </div>
              ))}

              {/* Corner accents */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#B8941F]/30 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#B8941F]/30 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#B8941F]/30 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#B8941F]/30 rounded-br-lg" />
            </div>
          </div>
        </div>

        {/* Cards de Benefícios */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              num: '01',
              title: 'Gestão de risco',
              desc: 'Antecipamos reajustes abusivos através de análise preditiva de dados e controle de sinistralidade.',
              ctaType: 'form' as const,
            },
            {
              num: '02',
              title: 'Migração técnica',
              desc: 'Troca estratégica de operadora focada em manter a rede credenciada reduzindo drasticamente o custo fixo.',
              ctaType: 'whatsapp' as const,
            },
            {
              num: '03',
              title: 'Zero burocracia',
              desc: 'Nossa tecnologia cuida de toda a transição e implantação, garantindo que não haja interrupção de cobertura.',
              ctaType: 'calculadora' as const,
            },
            {
              num: '04',
              title: 'Redução garantida',
              desc: 'Foco total em economia inteligente: entregamos resultados reais onde o custo do benefício cabe no seu orçamento.',
              ctaType: 'form' as const,
            },
          ].map((card) => (
            <div
              key={card.num}
              className="group relative p-8 rounded-2xl bg-white border border-gray-200 hover:border-[#B8941F]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden"
            >
              {/* Accent line top */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#B8941F] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="text-[#B8941F] mb-4 text-3xl font-black">
                {card.num}
              </div>
              <h4 className="text-gray-900 font-bold mb-3 text-lg sm:text-xl tracking-wide uppercase group-hover:text-[#B8941F] transition-colors">
                {card.title}
              </h4>
              <p className="text-gray-500 text-base sm:text-[1.06rem] leading-relaxed">{card.desc}</p>

              {card.ctaType === 'form' && (
                <a
                  href="#hero"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#B8941F]/35 px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-[2px] text-[#8A6812] transition-all hover:-translate-y-0.5 hover:bg-[#B8941F]/10"
                >
                  Solicitar análise
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5l6 6m0 0l-6 6m6-6h-15" />
                  </svg>
                </a>
              )}

              {card.ctaType === 'whatsapp' && (
                <a
                  href="https://wa.me/5521988179407?text=Olá! Gostaria de falar com um especialista."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-[2px] text-white transition-all hover:-translate-y-0.5 hover:bg-[#20BD5A]"
                >
                  Falar com especialista
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                  </svg>
                </a>
              )}

              {card.ctaType === 'calculadora' && (
                <a
                  href="#calculadora"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#111111] px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-[2px] text-white transition-all hover:-translate-y-0.5 hover:bg-black"
                >
                  Abrir calculadora
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H12.75v-.008zm0 2.25h.008v.008H12.75v-.008zm2.25-6.75h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
