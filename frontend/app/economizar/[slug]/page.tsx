import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/og-image';
import CalculadoraClient from './CalculadoraClient';

// =============================================
// SERVER COMPONENT — valida slug e salva cookie
// =============================================

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Metadata dinâmica para SEO/OG
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let nome = 'Humano Saúde';

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('corretores')
      .select('nome')
      .eq('slug', slug)
      .eq('ativo', true)
      .single();

    if (data?.nome) nome = data.nome;
  } catch {
    // Fallback para nome padrão
  }

  return {
    title: `Calculadora de Economia | ${nome} — Humano Saúde`,
    description: `Descubra quanto você pode economizar no seu plano de saúde com ${nome}. Análise gratuita com IA.`,
    openGraph: {
      title: `Economize até 40% no Plano de Saúde | ${nome}`,
      description: 'Envie sua fatura e descubra em segundos quanto pode reduzir. 100% gratuito.',
      url: `https://humanosaude.com.br/economizar/${slug}`,
      siteName: 'Humano Saúde',
      type: 'website',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Economize até 40% no Plano de Saúde | ${nome}`,
      description: 'Envie sua fatura e descubra em segundos quanto pode reduzir. 100% gratuito.',
      images: [OG_IMAGE.url],
    },
  };
}

export default async function EconomizarPage({ params }: PageProps) {
  const { slug } = await params;

  // Validar slug no Supabase
  const supabase = createServiceClient();

  let corretor;
  try {
    const { data, error } = await supabase
      .from('corretores')
      .select('id, nome, slug, foto_url, logo_personalizada_url, cor_primaria, whatsapp, telefone, email')
      .eq('slug', slug)
      .eq('ativo', true)
      .single();

    if (error || !data) {
      console.error('[economizar] Corretor não encontrado para slug:', slug, error?.message);
      notFound();
    }

    corretor = data;
  } catch (err) {
    console.error('[economizar] Erro ao buscar corretor:', err);
    notFound();
  }

  // Salvar corretor_id no cookie (7 dias)
  try {
    const cookieStore = await cookies();
    cookieStore.set('corretor_indicacao_id', corretor.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
  } catch (err) {
    console.error('[economizar] Erro ao setar cookie:', err);
  }

  return (
    <CalculadoraClient
      corretor={{
        id: corretor.id,
        nome: corretor.nome,
        slug: corretor.slug || slug,
        foto_url: corretor.foto_url || null,
        logo_personalizada_url: corretor.logo_personalizada_url || null,
        cor_primaria: corretor.cor_primaria || '#D4AF37',
        whatsapp: corretor.whatsapp || null,
        telefone: corretor.telefone || null,
        email: corretor.email || null,
      }}
    />
  );
}
