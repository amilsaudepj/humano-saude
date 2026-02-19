'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function HeaderV2() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloquear scroll do body quando menu mobile está aberto
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const menuItems = [
    { label: 'Início',        section: 'hero' },
    { label: 'Comparativo',   section: 'pratica' },
    { label: 'Método',        section: 'metodo' },
    { label: 'Tecnologia IA', section: 'ia' },
    { label: 'Calculadora',   section: 'calculadora' },
    { label: 'Depoimentos',   section: 'testimonials' },
    { label: 'FAQ',           section: 'faq' },
  ];

  return (
    <>
      {/* Banner Marquee Dourado */}
      <div className="fixed top-0 left-0 right-0 z-[10001] bg-[#B8941F] overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-2 w-max">
          <span className="inline-block text-xs font-bold text-white tracking-widest px-8">
            ✦ HUMANO SAÚDE: ANALISAR, ASSESSORAR E ACOMPANHAR
          </span>
          <span className="inline-block text-xs font-bold text-white tracking-widest px-8">
            ✦ REDUZA 40% DO CUSTO DO SEU PLANO DE SAÚDE COM SEU CNPJ
          </span>
          <span className="inline-block text-xs font-bold text-white tracking-widest px-8">
            ✦ CONSULTORIA ESPECIALIZADA BRASIL: (21) 98817-9407
          </span>
          <span className="inline-block text-xs font-bold text-white tracking-widest px-8">
            ✦ HUMANO SAÚDE: ANALISAR, ASSESSORAR E ACOMPANHAR
          </span>
          <span className="inline-block text-xs font-bold text-white tracking-widest px-8">
            ✦ REDUZA 40% DO CUSTO DO SEU PLANO DE SAÚDE COM SEU CNPJ
          </span>
          <span className="inline-block text-xs font-bold text-white tracking-widest px-8">
            ✦ CONSULTORIA ESPECIALIZADA BRASIL: (21) 98817-9407
          </span>
        </div>
      </div>

      <header
        className={`fixed top-[32px] left-0 right-0 z-[9999] transition-all duration-300 bg-black shadow-lg`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 lg:h-20 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => scrollTo('hero')} className="relative cursor-pointer flex-shrink-0">
            <Image
              src="/images/logos/LOGO 1 SEM FUNDO.png"
              alt="Humano Saúde"
              width={160}
              height={50}
              className={`h-10 lg:h-12 w-auto transition-all duration-300`}
              priority
            />
          </button>

          {/* Nav Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => (
              <button
                key={item.section}
                onClick={() => scrollTo(item.section)}
                className="px-3 xl:px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer text-gray-300 hover:text-white hover:bg-white/10"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA Desktop + Hamburger */}
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/5521988179407?text=Olá! Gostaria de uma cotação empresarial."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 bg-[#B8941F] hover:bg-[#C5A028] text-white"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
              </svg>
              Falar com Especialista
            </a>

            {/* Hamburger Mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors"
              aria-label="Abrir menu"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ===== Menu Mobile Overlay ===== */}
      <div
        className={`fixed inset-0 z-[10000] lg:hidden transition-all duration-300 ${
          isMenuOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute right-0 top-0 h-full w-[280px] sm:w-[320px] bg-black shadow-2xl transition-transform duration-300 flex flex-col ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Close */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <Image
              src="/images/logos/LOGO 1 SEM FUNDO.png"
              alt="Humano Saúde"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Fechar menu"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => (
              <button
                key={item.section}
                onClick={() => scrollTo(item.section)}
                className="w-full text-left px-6 py-3.5 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors uppercase tracking-wider"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* WhatsApp CTA Mobile */}
          <div className="p-5 border-t border-white/10">
            <a
              href="https://wa.me/5521988179407?text=Olá! Gostaria de uma cotação empresarial."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
              </svg>
              Falar com Especialista
            </a>
          </div>
        </div>
      </div>

      {/* Marquee Animation */}
      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
          display: inline-block;
          will-change: transform;
        }
      `}</style>
    </>
  );
}
