'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -120; // Compensa a altura do header fixo
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const menuItems = [
    { label: 'Tecnologia IA', section: 'ia-simulator' },
    { label: 'Calculadora', section: 'calculadora' },
    { label: 'Resultados', section: 'case-studies' },
    { label: 'Método', section: 'triade' },
    { label: 'Depoimentos', section: 'testimonials' },
    { label: 'FAQ', section: 'faq' },
  ];

  return (
    <>
      {/* ✅ Banner Dourado Fixo */}
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-[#bf953f] via-[#aa771c] to-[#bf953f] border-b border-white/10 overflow-clip">
        <div className="animate-marquee whitespace-nowrap py-2.5 w-max">
          <span className="inline-block text-xs font-bold text-white tracking-widest px-8">
            ✦ HUMANO SAÚDE: ANALISAR, ASSESSORAR E ACOMPANHAR
          </span>
          <span className="inline-block text-xs font-bold text-white tracking-widest px-8">
            ✦ REDUZA 40% DO CUSTO DO SEU PLANO INDIVIDUAL OU EMPRESARIAL
          </span>
          <span className="inline-block text-xs font-bold text-white tracking-widest px-8">
            ✦ CONSULTORIA ESPECIALIZADA BRASIL: (21) 98817-9407
          </span>
          <span className="inline-block text-xs font-bold text-white tracking-widest px-8">
            ✦ HUMANO SAÚDE: ANALISAR, ASSESSORAR E ACOMPANHAR
          </span>
          <span className="inline-block text-xs font-bold text-white tracking-widest px-8">
            ✦ REDUZA 40% DO CUSTO DO SEU PLANO INDIVIDUAL OU EMPRESARIAL
          </span>
        </div>
      </div>

      {/* ✅ Header Preto */}
      <header 
        className={`fixed top-10 left-0 right-0 z-[9998] bg-black transition-all duration-300 ${
          isScrolled ? 'shadow-2xl' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex justify-between items-center">
          {/* Logo */}
          <button 
            onClick={() => scrollToSection('hero')}
            className="relative cursor-pointer"
          >
            <Image
              src="/images/logos/LOGO 1 SEM FUNDO.png"
              alt="Humano Saúde"
              width={180}
              height={60}
              className="h-12 lg:h-16 w-auto"
              priority
            />
          </button>

          {/* Nav Desktop */}
          <nav className="hidden lg:flex space-x-8 text-[11px] font-bold tracking-[2px] text-gray-300 uppercase">
            {menuItems.map((item) => (
              <button
                key={item.section}
                onClick={() => scrollToSection(item.section)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/5521988179407?text=Olá!"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#bf953f] to-[#aa771c] text-white rounded text-xs uppercase font-black tracking-widest shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
              </svg>
              Falar com Especialista
            </a>

            {/* Hamburger Mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Abrir menu"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ✅ Menu Mobile */}
      <div
        className={`fixed inset-0 bg-black z-[10000] flex flex-col p-10 lg:hidden transition-transform duration-400 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          onClick={() => setIsMenuOpen(false)}
          className="self-end text-white text-5xl"
          aria-label="Fechar menu"
        >
          &times;
        </button>
        <div className="flex flex-col gap-8 mt-12 text-center">
          {menuItems.map((item) => (
            <button
              key={item.section}
              onClick={() => scrollToSection(item.section)}
              className="text-white text-2xl font-bold uppercase tracking-widest hover:text-[#bf953f] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ Spacer para compensar header fixo */}
      <div className="h-[88px]" aria-hidden="true" />

      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
          display: inline-block;
          will-change: transform;
        }
      `}</style>
    </>
  );
}
