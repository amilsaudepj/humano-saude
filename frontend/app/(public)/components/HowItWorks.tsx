'use client';

import { MagneticButton } from '@/components/premium';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Cadastro',
      desc: 'Preencha o formulário do site ou fale diretamente no WhatsApp',
      gradient: 'from-blue-500 to-cyan-500',
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
    {
      step: '02',
      title: 'Perguntas Essenciais',
      desc: 'Respondemos algumas perguntas rápidas sobre suas necessidades',
      gradient: 'from-purple-500 to-pink-500',
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
    },
    {
      step: '03',
      title: 'Cotação Gerada',
      desc: 'Receba sua cotação personalizada em até 10 minutos',
      gradient: 'from-emerald-500 to-teal-500',
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-black overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Título */}
        <div className="text-center mb-20">
          <div className="inline-block bg-gradient-to-r from-[#bf953f] to-[#aa771c] px-6 py-2 rounded-full mb-4">
            <span className="text-xs font-bold text-white uppercase tracking-[2px]">Como Funciona</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase font-cinzel leading-tight">
            Seu Atendimento<br />
            <span className="bg-gradient-to-r from-[#bf953f] to-[#aa771c] bg-clip-text text-transparent">
              Rápido e Personalizado
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Em apenas 3 passos simples, você recebe sua cotação personalizada em menos de <strong className="text-[#bf953f]">10 minutos</strong>
          </p>
        </div>

        {/* Cards com ícones SVG premium */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((item, i) => (
            <div
              key={i}
              className="group relative bg-zinc-900/80 backdrop-blur-xl p-10 rounded-3xl border border-[#bf953f]/20 shadow-2xl hover:shadow-[0_20px_60px_rgba(191,149,63,0.3)] hover:border-[#bf953f]/50 transition-all duration-500 hover:-translate-y-3 overflow-hidden"
            >
              {/* Gradiente de fundo animado */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              {/* Número flutuante */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-[#bf953f] via-[#ffd700] to-[#aa771c] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <span className="text-3xl font-black text-white font-cinzel drop-shadow-lg">{item.step}</span>
              </div>

              {/* Ícone SVG premium */}
              <div className="relative mb-8 inline-block">
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-3xl blur-xl opacity-40 animate-pulse`} />
                  <div className={`relative w-28 h-28 bg-gradient-to-br ${item.gradient} rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full opacity-60 animate-ping" />
                  <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-[#ffd700] rounded-full opacity-60 animate-ping" style={{ animationDelay: '0.5s' }} />
                </div>
              </div>

              {/* Título */}
              <h3 className="text-2xl font-black text-white mb-4 uppercase font-cinzel group-hover:text-[#bf953f] transition-colors duration-300">
                {item.title}
              </h3>

              {/* Descrição */}
              <p className="text-gray-400 leading-relaxed mb-6">{item.desc}</p>

              {/* Progress Bar animada */}
              <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#bf953f] via-[#ffd700] to-[#aa771c] rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1000"
                />
              </div>

              {/* Linha decorativa inferior */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#bf953f] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Efeito de brilho no hover */}
              <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:left-full transition-all duration-1000 transform skew-x-12" />
            </div>
          ))}
        </div>

        {/* CTA Final Premium com MagneticButton */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-12 lg:p-16 rounded-2xl sm:rounded-[2.5rem] border-2 border-[#bf953f] shadow-[0_0_60px_rgba(191,149,63,0.3)] overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, #bf953f 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Gradient orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#bf953f] rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ffd700] rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#bf953f]/20 border border-[#bf953f] px-6 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-[#ffd700] rounded-full animate-pulse" />
              <span className="text-xs font-bold text-[#ffd700] uppercase tracking-[3px]">Comece Agora</span>
            </div>

            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase leading-tight font-cinzel">
              Pronto para <span className="text-[#ffd700]">Economizar?</span>
            </h3>
            
            <p className="text-white/80 mb-10 max-w-3xl mx-auto text-xl leading-relaxed">
              Descubra como reduzir até <strong className="text-[#ffd700] text-3xl">40%</strong> no valor do seu plano de saúde
              <br />
              <span className="text-white/60">✨ Atendimento gratuito • Análise em 10min • Suporte completo</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <MagneticButton strength={0.4} range={120}>
                <a
                  href="#calculadora"
                  className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-[#bf953f] via-[#ffd700] to-[#aa771c] text-white px-6 sm:px-10 lg:px-14 py-5 sm:py-6 rounded-full text-sm sm:text-base uppercase tracking-widest font-black shadow-2xl hover:shadow-[0_20px_60px_rgba(255,215,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="relative">🎯 Calcular Economia</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </MagneticButton>

              <MagneticButton strength={0.3} range={100}>
                <a
                  href="https://wa.me/5521988179407?text=Olá! Quero economizar no meu plano de saúde"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl text-white border-2 border-white/20 px-6 sm:px-10 lg:px-14 py-5 sm:py-6 rounded-full text-sm sm:text-base uppercase tracking-widest font-black hover:bg-white/20 hover:border-[#ffd700]/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
                  </svg>
                  Falar com Especialista
                </a>
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
