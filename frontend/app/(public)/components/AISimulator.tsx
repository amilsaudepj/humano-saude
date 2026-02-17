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
            <h3 className="text-4xl lg:text-5xl font-black uppercase text-black leading-[1.1] mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
              O FIM DO<br />
              <span className="text-[#D4AF37]">CUSTO INEFICIENTE</span>
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
            <div className="relative bg-black h-[420px] lg:h-[480px] rounded-3xl border border-[#D4AF37]/28 overflow-hidden shadow-2xl shadow-black/30">
              
              {/* Glow de fundo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#D4AF37]/12 rounded-full blur-3xl pointer-events-none" />

              {/* Logo Central com anéis */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[5]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-28 h-28 border border-[#D4AF37]/60 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-48 h-48 border border-[#D4AF37]/35 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
                  <div className="absolute w-72 h-72 border border-[#D4AF37]/18 rounded-full" />
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
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black font-bold text-sm px-6 py-3 shadow-xl shadow-[#D4AF37]/45'
                      : 'bg-[#D4AF37]/8 border border-[#D4AF37]/30 text-[#E6C76A] text-xs font-medium tracking-wide'
                  } ${
                    activeStep >= i ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  }`}
                >
                  {step.text}
                </div>
              ))}

              {/* Corner accents */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]/55 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]/55 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]/55 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]/55 rounded-br-lg" />
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
            },
            {
              num: '02',
              title: 'Migração técnica',
              desc: 'Troca estratégica de operadora focada em manter a rede credenciada reduzindo drasticamente o custo fixo.',
            },
            {
              num: '03',
              title: 'Zero burocracia',
              desc: 'Nossa tecnologia cuida de toda a transição e implantação, garantindo que não haja interrupção de cobertura.',
            },
            {
              num: '04',
              title: 'Redução garantida',
              desc: 'Foco total em economia inteligente: entregamos resultados reais onde o custo do benefício cabe no seu orçamento.',
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
              <h4 className="text-gray-900 font-bold mb-3 text-base tracking-wide uppercase group-hover:text-[#B8941F] transition-colors">
                {card.title}
              </h4>
              <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
