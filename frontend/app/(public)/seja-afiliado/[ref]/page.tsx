'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { resolverRefParaCorretor } from '@/app/actions/corretor-afiliados';
import SejaAfiliadoLP from '../SejaAfiliadoLP';
import { Loader2 } from 'lucide-react';

/** LP do corretor: ref = slug do corretor ou token do afiliado. CTAs levam a /indicar?ref=ref (indicações atreladas ao corretor). */
export default function SejaAfiliadoRefPage() {
  const params = useParams();
  const router = useRouter();
  const ref = typeof params.ref === 'string' ? params.ref.trim() : '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'invalid'>('loading');

  useEffect(() => {
    if (!ref) {
      router.replace('/seja-afiliado');
      return;
    }
    resolverRefParaCorretor(ref).then((result) => {
      if (result.success && result.corretor_id) {
        setStatus('ok');
      } else {
        router.replace('/seja-afiliado');
      }
    });
  }, [ref, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (status === 'invalid') return null;

  return <SejaAfiliadoLP refParam={ref} />;
}
