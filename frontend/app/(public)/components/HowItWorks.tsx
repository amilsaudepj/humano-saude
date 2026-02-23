'use client';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Cadastro',
      desc: 'Preencha o formulário do site ou fale diretamente no WhatsApp',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
    {
      step: '02',
      title: 'Análise personalizada',
      desc: 'Nossa equipe analisa seu perfil e encontra as melhores opções do mercado',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
    },
    {
      step: '03',
      title: 'Cotação em 10 minutos',
      desc: 'Receba sua cotação personalizada com as melhores condições do mercado',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Título */}
        <div className="text-center mb-20" role="region" aria-labelledby="how-it-works-title">
          <span className="inline-block px-5 py-1.5 bg-[#B8941F]/10 text-[#B8941F] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[#B8941F]/20">
            Como funciona
          </span>
          <h2 id="how-it-works-title" className="text-3xl md:text-4xl lg:text-5xl font-black text-black mb-4">
            Seu atendimento{' '}
            <span className="text-[#B8941F]">rápido e personalizado</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Em apenas 3 passos simples, você recebe sua cotação personalizada em menos de <strong className="text-black">10 minutos</strong>
          </p>
        </div>

        {/* Cards com connector */}
        <div className="grid md:grid-cols-3 gap-0 mb-16 relative">
          {/* Linha connector (desktop) */}
          <div className="hidden md:block absolute top-[52px] left-[16.66%] right-[16.66%] h-[2px] bg-gradient-to-r from-[#B8941F]/20 via-[#B8941F] to-[#B8941F]/20 z-0" />

          {steps.map((item, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center px-6 py-10 group">
              {/* Número com anel */}
              <div className="relative mb-6">
                <div className="absolute inset-0 w-[68px] h-[68px] rounded-full bg-[#B8941F]/10 group-hover:bg-[#B8941F]/20 transition-all scale-125" />
                <div className="relative w-[68px] h-[68px] rounded-full bg-black flex items-center justify-center text-white text-xl font-black shadow-lg shadow-black/20 group-hover:shadow-[#B8941F]/30 transition-all group-hover:scale-105">
                  {item.step}
                </div>
              </div>

              {/* Ícone */}
              <div className="w-14 h-14 bg-[#B8941F]/10 border border-[#B8941F]/20 rounded-2xl flex items-center justify-center mb-5 text-[#B8941F] group-hover:bg-[#B8941F] group-hover:text-white group-hover:border-[#B8941F] transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[#B8941F]/20">
                {item.icon}
              </div>

              {/* Título */}
              <h3 className="text-lg font-bold text-black mb-2 group-hover:text-[#B8941F] transition-colors">
                {item.title}
              </h3>

              {/* Descrição */}
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Final */}
        <div className="relative bg-black p-8 sm:p-12 lg:p-16 rounded-3xl overflow-hidden">
          {/* Glow decorativo */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#B8941F]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#B8941F]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center">
            <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
              Pronto para <span className="text-[#B8941F]">economizar?</span>
            </h3>
            
            <p className="text-white/60 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Descubra como reduzir até <strong className="text-[#B8941F]">40%</strong> no valor do seu plano de saúde.
              Atendimento gratuito, análise em 10 minutos e suporte completo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#calculadora"
                className="inline-flex items-center gap-3 bg-[#B8941F] hover:bg-[#A07E18] text-white px-8 py-4 rounded-xl text-sm uppercase tracking-wider font-bold transition-all hover:-translate-y-0.5 shadow-lg shadow-[#B8941F]/20"
              >
                Calcular economia
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>

              <a
                href="https://wa.me/5521988179407?text=Olá! Quero economizar no meu plano de saúde"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Falar com especialista no WhatsApp"
                className="inline-flex items-center gap-3 bg-transparent text-white border border-white/20 px-8 py-4 rounded-xl text-sm uppercase tracking-wider font-bold hover:bg-white/10 transition-all hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Falar com especialista
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
