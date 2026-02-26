'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const SCROLL_THRESHOLD = 48;

const CTA_WHATSAPP =
  'https://wa.me/5521988179407?text=Olá!%20Gostaria%20de%20uma%20cotação%20de%20plano%20de%20saúde%20para%20pessoa%20física.';

const MENU_ITEMS = [
  { label: 'Início', section: 'hero' },
  { label: 'Rede', section: 'rede' },
  { label: 'Como funciona', section: 'como-funciona' },
  { label: 'Compare', section: 'compare' },
  { label: 'Depoimentos', section: 'depoimentos' },
  { label: 'Dúvidas', section: 'faq' },
];

export default function HeaderPF() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  /** ClonewebX: header glass ao scrollar – .scrolling #brxe-gjlhql (backdrop-filter blur) */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <style jsx>{`
        /* Header container – transição visível ao rolar */
        .header-pf {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .header-pf[data-scrolled='true'] {
          transform: translateY(-4px);
        }
        /* Fundo SEM scroll: sólido opaco */
        .header-pf::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(0, 0, 0, 0.94);
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          pointer-events: none;
          transition: background 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.45s ease;
        }
        /* Ao rolar: fundo opaco + blur – texto atrás ilegível */
        .header-pf[data-scrolled='true']::before {
          background: rgba(0, 0, 0, 0.92);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
        }
        /* Camada de confusão visual (grain/noise) só ao rolar */
        .header-pf::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 1;
          border-radius: 9999px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .header-pf[data-scrolled='true']::after {
          opacity: 1;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch' result='n'/%3E%3CfeColorMatrix in='n' type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          mix-blend-mode: overlay;
          opacity: 0.35;
        }
        /* Conteúdo SEMPRE nítido por cima (reforçado) */
        .header-pf-content {
          position: relative;
          z-index: 20;
          transform: translateZ(0.1px);
          filter: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        @media (max-width: 768px) {
          .header-pf::before,
          .header-pf::after {
            border-radius: 20px;
          }
          .header-pf[data-scrolled='true']::before {
            background: rgba(0, 0, 0, 0.92);
            backdrop-filter: blur(32px) saturate(180%);
            -webkit-backdrop-filter: blur(32px) saturate(180%);
          }
        }
      `}</style>
      <div className="fixed top-4 left-0 right-0 z-[9999] px-4 sm:px-6 pointer-events-none">
        <header
          className="header-pf pointer-events-auto relative max-w-[1400px] mx-auto rounded-full overflow-hidden transition-all duration-300 h-14 sm:h-16 lg:h-[72px] flex items-center justify-between px-5 sm:px-6 lg:px-8"
          data-scrolled={isScrolled}
        >
          <div className="header-pf-content flex items-center justify-between w-full min-w-0">
          <button onClick={() => scrollTo('hero')} className="cursor-pointer flex-shrink-0 flex items-center">
            <Image
              src="/images/logos/LOGO 1 SEM FUNDO.png"
              alt="Humano Saúde"
              width={160}
              height={50}
              className="h-10 lg:h-12 w-auto"
              priority
            />
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.section}
                onClick={() => scrollTo(item.section)}
                className="px-3 xl:px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer text-gray-300 hover:text-white hover:bg-white/10"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={CTA_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 bg-[#B8941F] hover:bg-[#C5A028] text-white"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 448 512">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
              Cotação grátis
            </a>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors text-white"
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          </div>
        </header>
      </div>

      {/* Menu Mobile – preto igual empresas */}
      <div
        className={`fixed inset-0 z-[10002] lg:hidden transition-all duration-300 ${
          isMenuOpen ? 'visible' : 'invisible'
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={`absolute right-0 top-0 h-full w-[280px] sm:w-[320px] bg-black shadow-2xl transition-transform duration-300 flex flex-col ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
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
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.section}
                onClick={() => scrollTo(item.section)}
                className="w-full text-left px-6 py-3.5 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors uppercase tracking-wider"
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-5 border-t border-white/10">
            <a
              href={CTA_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
              Cotação grátis
            </a>
          </div>
        </div>
      </div>

    </>
  );
}
