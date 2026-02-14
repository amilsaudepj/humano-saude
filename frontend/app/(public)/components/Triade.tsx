'use client';

import { useEffect, useRef, useState } from 'react';

export default function Triade() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const marker = window.innerHeight * 0.7;
      const passed = marker - rect.top;
      const pct = Math.max(0, Math.min(passed / rect.height, 1)) * 100;

      setProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <section id="metodo" className="py-20 sm:py-32 bg-black text-white text-center border-t border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase italic tracking-widest font-cinzel leading-[1.1]">
          A tríade Humana
        </h2>
        <div className="w-24 h-1.5 bg-gradient-to-r from-[#bf953f] to-[#aa771c] mx-auto mb-20" />

        <div id="timeline-container" ref={containerRef} className="relative pl-10 md:pl-40 text-left mb-20">
          {/* Linha vertical */}
          <div className="absolute left-8 md:left-20 top-0 bottom-0 w-[2px] bg-white/10">
            <div
              className="bg-gradient-to-b from-[#bf953f] to-[#aa771c] w-full transition-all duration-300 ease-out"
              style={{ height: `${progress}%` }}
            />
          </div>

          <div className="space-y-40">
            {/* Step 01 */}
            <div className="relative">
              <div className="absolute -left-12 md:-left-28 top-0 h-12 w-12 md:h-16 md:w-16 border-2 border-white/20 bg-black rounded-full flex items-center justify-center font-bold text-xs md:text-lg shadow-xl">
                01
              </div>
              <h3 className="text-2xl font-bold italic bg-gradient-to-r from-[#bf953f] to-[#aa771c] bg-clip-text text-transparent mb-4 text-left font-cinzel">
                Analisar
              </h3>
              <p className="text-xl text-gray-400 font-light leading-relaxed">
                Mapeamos sua fatura atual para expor cobranças indevidas e abusos ocultos.
              </p>
            </div>

            {/* Step 02 */}
            <div className="relative">
              <div className="absolute -left-12 md:-left-28 top-0 h-12 w-12 md:h-16 md:w-16 border-2 border-white/20 bg-black rounded-full flex items-center justify-center font-bold text-xs md:text-lg shadow-xl">
                02
              </div>
              <h3 className="text-2xl font-bold italic bg-gradient-to-r from-[#bf953f] to-[#aa771c] bg-clip-text text-transparent mb-4 text-left font-cinzel">
                Assessorar
              </h3>
              <p className="text-xl text-gray-400 font-light leading-relaxed">
                Escolha técnica focada em rede hospitalar e viabilidade financeira de mercado.
              </p>
            </div>

            {/* Step 03 */}
            <div className="relative">
              <div className="absolute -left-12 md:-left-28 top-0 h-12 w-12 md:h-16 md:w-16 border-2 border-white/20 bg-black rounded-full flex items-center justify-center font-bold text-xs md:text-lg shadow-xl">
                03
              </div>
              <h3 className="text-2xl font-bold italic bg-gradient-to-r from-[#bf953f] to-[#aa771c] bg-clip-text text-transparent mb-4 text-left font-cinzel">
                Acompanhar
              </h3>
              <p className="text-xl text-gray-400 font-light leading-relaxed">
                Gestão contínua vitalícia para que você nunca mais sofra reajustes abusivos.
              </p>
            </div>
          </div>
        </div>

        <a
          href="https://wa.me/5521988179407?text=Olá!%20Quero%20implementar%20a%20Tríade%20Humana."
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#bf953f] to-[#aa771c] px-12 py-5 rounded-xl text-sm uppercase tracking-widest mt-12 font-black text-white hover:shadow-xl transition-all"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
          </svg>
          Implementar Método Agora
        </a>
      </div>
    </section>
  );
}
