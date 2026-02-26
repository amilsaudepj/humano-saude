'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { TabelaValor } from './PlanosCarousel';

const PlanosCarousel = dynamic(() => import('./PlanosCarousel'), {
  loading: () => (
    <section className="w-full py-24 bg-black overflow-hidden">
      <div className="text-center px-6 animate-pulse">
        <div className="h-10 bg-white/10 rounded w-64 mx-auto mb-4" />
        <div className="h-6 bg-white/5 rounded w-96 mx-auto" />
      </div>
    </section>
  ),
});

export default function SectionPlanosCarousel() {
  const [planos, setPlanos] = useState<TabelaValor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pessoa-fisica/planos')
      .then((res) => res.ok ? res.json() : [])
      .then((data: TabelaValor[]) => {
        setPlanos(Array.isArray(data) ? data : []);
      })
      .catch(() => setPlanos([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="w-full py-24 bg-black overflow-hidden">
        <div className="text-center px-6 animate-pulse">
          <div className="h-10 bg-white/10 rounded w-64 mx-auto mb-4" />
          <div className="h-6 bg-white/5 rounded w-96 mx-auto" />
        </div>
      </section>
    );
  }

  return <PlanosCarousel planos={planos} />;
}
