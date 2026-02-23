'use client';

import Image from 'next/image';
import { useEffect, useRef, useCallback } from 'react';

const insurers = [
  { name: 'Bradesco Saúde', logo: '/images/operadoras/bradesco-logo.png' },
  { name: 'Amil',           logo: '/images/operadoras/amil-logo.png' },
  { name: 'SulAmérica',     logo: '/images/operadoras/sulamerica-logo.png' },
  { name: 'Porto Saúde',    logo: '/images/operadoras/portosaude-logo.png' },
  { name: 'Prevent Senior', logo: '/images/operadoras/preventsenior-logo.png' },
  { name: 'Leve Saúde',     logo: '/images/operadoras/levesaude-logo.png' },
  { name: 'Medsenior',      logo: '/images/operadoras/medsenior-logo.png' },
  { name: 'Assim Saúde',    logo: '/images/operadoras/assimsaude-logo.png' },
];

function InfiniteCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const rafRef = useRef<number>(0);
  const speed = 1.2; // pixels por frame

  const animate = useCallback(() => {
    if (!trackRef.current) return;
    posRef.current -= speed;
    // Largura de um bloco = metade do total (temos 2 cópias)
    const halfWidth = trackRef.current.scrollWidth / 2;
    if (Math.abs(posRef.current) >= halfWidth) {
      posRef.current = 0;
    }
    trackRef.current.style.transform = `translateX(${posRef.current}px)`;
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  return (
    <div className="sm:hidden relative overflow-hidden">
      <div
        ref={trackRef}
        className="flex gap-10 will-change-transform"
      >
        {[...insurers, ...insurers].map((insurer, idx) => (
          <div
            key={`logo-${idx}`}
            className="flex-shrink-0 flex items-center justify-center"
            style={{ minWidth: '160px' }}
          >
            <Image
              src={insurer.logo}
              alt={insurer.name}
              width={160}
              height={60}
              className={`w-auto object-contain ${insurer.name === 'Porto Saúde' ? 'h-24' : 'h-14'}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrustBar() {
  return (
    <section className="py-10 sm:py-14 bg-slate-50 border-y border-gray-200/60 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-[3px] mb-8 sm:mb-10">
          Trabalhamos com as melhores seguradoras
        </p>

        {/* Mobile: carrossel infinito */}
        <InfiniteCarousel />

        {/* Desktop: grid */}
        <div className="hidden sm:grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-8 lg:gap-10 items-center justify-items-center">
          {insurers.map((insurer) => (
            <div
              key={insurer.name}
              className="group flex items-center justify-center"
            >
              <Image
                src={insurer.logo}
                alt={insurer.name}
                width={150}
                height={55}
                className={`w-auto object-contain transition-all duration-500 ${insurer.name === 'Porto Saúde' ? 'h-20 lg:h-24' : 'h-14 lg:h-16'}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
