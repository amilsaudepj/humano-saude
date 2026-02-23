'use client';

import { useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';

const logos = [
  { name: 'Amil', url: '/images/operadoras/amil-logo.png' },
  { name: 'Bradesco', url: '/images/operadoras/bradesco-logo.png' },
  { name: 'SulAmérica', url: '/images/operadoras/sulamerica-logo.png' },
  { name: 'Unimed', url: '/images/operadoras/unimed-logo.png' },
  { name: 'Porto Saúde', url: '/images/operadoras/portosaude-logo.png' },
  { name: 'Assim Saúde', url: '/images/operadoras/assimsaude-logo.png' },
  { name: 'Leve Saúde', url: '/images/operadoras/levesaude-logo.png' },
  { name: 'MedSênior', url: '/images/operadoras/medsenior-logo.png' },
  { name: 'Prevent Senior', url: '/images/operadoras/preventsenior-logo.png' },
];

export default function Partners() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'start',
      slidesToScroll: 1,
      containScroll: 'trimSnaps',
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );

  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="w-full px-4 text-center">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[4px] mb-10 italic">
          Operadoras e redes credenciadas
        </p>

        {/* Mobile: Carrossel Embla */}
        <div className="block md:hidden max-w-[980px] mx-auto mb-12">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {[...logos, ...logos].map((logo, idx) => (
                <div
                  key={idx}
                  className="flex-[0_0_calc(50%-8px)] min-w-0 flex items-center justify-center p-4 bg-white rounded-2xl border border-gray-100"
                >
                  <Image
                    src={logo.url}
                    alt={logo.name}
                    width={logo.name === 'Unimed' || logo.name === 'Porto Saúde' ? 130 : 92}
                    height={logo.name === 'Unimed' || logo.name === 'Porto Saúde' ? 40 : 28}
                    className={`w-auto object-contain ${(logo.name === 'Unimed' || logo.name === 'Porto Saúde') ? 'max-w-[130px] h-10' : 'max-w-[92px] h-7'}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:block">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-16 items-center justify-items-center max-w-[950px] mx-auto mb-14">
            {logos.slice(0, 5).map((logo) => (
              <Image
                key={logo.name}
                src={logo.url}
                alt={logo.name}
                width={logo.name === 'Unimed' || logo.name === 'Porto Saúde' ? 160 : 110}
                height={logo.name === 'Unimed' || logo.name === 'Porto Saúde' ? 56 : 40}
                className={`h-auto opacity-80 hover:opacity-100 transition-opacity ${(logo.name === 'Unimed' || logo.name === 'Porto Saúde') ? 'max-w-[160px]' : 'max-w-[110px]'}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16 items-center justify-items-center max-w-[760px] mx-auto mb-16">
            {logos.slice(5).map((logo) => (
              <Image
                key={logo.name}
                src={logo.url}
                alt={logo.name}
                width={logo.name === 'Unimed' || logo.name === 'Porto Saúde' ? 160 : 110}
                height={logo.name === 'Unimed' || logo.name === 'Porto Saúde' ? 56 : 40}
                className={`h-auto opacity-80 hover:opacity-100 transition-opacity ${(logo.name === 'Unimed' || logo.name === 'Porto Saúde') ? 'max-w-[160px]' : 'max-w-[110px]'}`}
              />
            ))}
          </div>
        </div>

        <a
          href="https://wa.me/5521988179407?text=Olá!%20Gostaria%20de%20ver%20as%20redes%20credenciadas."
          className="inline-flex items-center gap-2 bg-gold-400 px-10 py-4 rounded-xl text-xs uppercase tracking-widest font-black text-white hover:shadow-xl transition-all"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
          </svg>
          Consultar Redes Credenciadas
        </a>
      </div>
    </section>
  );
}
