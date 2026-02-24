import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { resolverRefParaCorretor } from '@/app/actions/corretor-afiliados';
import { getCorretorById } from '@/app/actions/leads-indicacao';
import CalculadoraClient from '../../[slug]/CalculadoraClient';

interface PageProps {
  params: Promise<{ token: string }>;
}

/** Calculadora de economia com rastreio do afiliado. Cliente que usar este link fica vinculado ao afiliado e ao corretor. */
export default async function EconomizarAfiliadoPage({ params }: PageProps) {
  const { token } = await params;
  if (!token?.trim()) notFound();

  const resolved = await resolverRefParaCorretor(token.trim());
  if (!resolved.success || !resolved.corretor_id) notFound();

  const corretorRes = await getCorretorById(resolved.corretor_id);
  if (!corretorRes.success || !corretorRes.data) notFound();

  const corretor = corretorRes.data;

  try {
    const cookieStore = await cookies();
    cookieStore.set('corretor_indicacao_id', corretor.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    if (resolved.afiliado_id) {
      cookieStore.set('afiliado_indicacao_id', resolved.afiliado_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }
  } catch {
    // best effort
  }

  return (
    <CalculadoraClient
      corretor={corretor}
      afiliadoId={resolved.afiliado_id ?? undefined}
    />
  );
}
