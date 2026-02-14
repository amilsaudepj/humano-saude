'use client';

import { useEffect, useState } from 'react';

export default function AISimulator() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { id: 'step1', text: 'IDENTIFICANDO TABELAS...', position: 'top-[20%] left-[10%]' },
    { id: 'step2', text: 'ANALISANDO SINISTRALIDADE...', position: 'top-[30%] right-[15%]' },
    { id: 'step3', text: 'VARRENDO MERCADO...', position: 'bottom-[25%] left-[20%]' },
    { id: 'step4', text: '✓ ECONOMIA DETECTADA', position: 'top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2', isSuccess: true },
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
    <section id="ia" className="py-16 sm:py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-5 gap-16 items-center mb-24">
          
          {/* Texto */}
          <div className="lg:col-span-2 text-left">
            <h2 className="bg-gradient-to-r from-[#bf953f] to-[#aa771c] bg-clip-text text-transparent font-bold text-xs tracking-[6px] mb-6 uppercase">
              Eficiência nos Benefícios
            </h2>
            <h3 className="text-4xl font-black leading-[1.1] mb-8 italic font-cinzel uppercase">
              O FIM DO<br />CUSTO INEFICIENTE
            </h3>
            <p className="text-lg text-gray-400 leading-relaxed font-light mb-10">
              Nossa IA analisa em tempo real o mercado para identificar a{' '}
              <span className="bg-gradient-to-r from-[#bf953f] to-[#aa771c] bg-clip-text text-transparent font-bold">
                Migração Técnica
              </span>{' '}
              ideal para sua empresa.
            </p>
            <a
              href="https://wa.me/5521988179407?text=Olá!%20Quero%20iniciar%20o%20Mapeamento%20Digital%20com%20IA."
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#bf953f] to-[#aa771c] px-12 py-5 rounded-xl text-sm uppercase tracking-widest font-black text-white hover:shadow-xl transition-all"
            >
              Iniciar Mapeamento Digital
            </a>
          </div>

          {/* Simulador */}
          <div className="lg:col-span-3">
            <div className="relative bg-[#050505] h-[450px] lg:h-[500px] rounded-3xl border border-[#bf953f]/10 overflow-hidden">
              
              {/* Logo Central */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                {/* Anéis pulsantes */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-32 h-32 border-2 border-[#bf953f]/30 rounded-full animate-ping" />
                  <div className="absolute w-64 h-64 border-2 border-[#bf953f]/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
                <img
                  src="/images/logos/LOGO 2 SEM FUNDO.png"
                  alt="Humano Saúde IA"
                  className="w-20 h-auto relative z-10 opacity-90 brightness-200"
                />
              </div>

              {/* Data Points */}
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className={`absolute ${step.position} px-4 py-2 rounded-lg transition-all duration-600 ${
                    step.isSuccess
                      ? 'bg-gradient-to-r from-[#bf953f] to-[#aa771c] text-white font-bold text-sm px-5 py-3 shadow-[0_0_30px_rgba(191,149,63,0.6)]'
                      : 'bg-black/80 backdrop-blur-sm border border-[#bf953f]/30 text-gray-300 text-xs'
                  } ${
                    activeStep >= i ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  }`}
                >
                  {step.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cards de Benefícios */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              num: '01',
              title: 'Gestão de Risco',
              desc: 'Antecipamos reajustes abusivos através de análise preditiva de dados e controle de sinistralidade.',
            },
            {
              num: '02',
              title: 'Migração Técnica',
              desc: 'Troca estratégica de operadora focada em manter a rede credenciada reduzindo drasticamente o custo fixo.',
            },
            {
              num: '03',
              title: 'Zero Burocracia',
              desc: 'Nossa tecnologia cuida de toda a transição e implantação, garantindo que não haja interrupção de cobertura.',
            },
            {
              num: '04',
              title: 'Redução Garantida',
              desc: 'Foco total em economia inteligente: entregamos resultados reais onde o custo do benefício cabe no seu orçamento.',
            },
          ].map((card) => (
            <div
              key={card.num}
              className="group p-8 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-[#bf953f]/30 transition-all"
            >
              <div className="bg-gradient-to-r from-[#bf953f] to-[#aa771c] bg-clip-text text-transparent mb-4 text-3xl font-bold">
                {card.num}
              </div>
              <h4 className="text-white font-bold mb-4 text-lg tracking-widest uppercase group-hover:text-[#bf953f] transition-colors">
                {card.title}
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed font-light">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
