import type { Metadata } from 'next';
import CalculadoraEconomia from './components/CalculadoraEconomia';
import { OG_IMAGE } from '@/lib/og-image';

// =============================================
// PÁGINA PÚBLICA — CALCULADORA SEM INDICAÇÃO
// Para tráfego pago e acesso direto
// URL: /economizar
// =============================================

export const metadata: Metadata = {
  title: 'Calculadora de Economia no Plano de Saúde | Humano Saúde',
  description:
    'Descubra quanto você pode economizar no seu plano de saúde. Envie sua fatura e receba uma análise gratuita com IA em segundos. Até 40% de economia.',
  openGraph: {
    title: 'Economize até 40% no Plano de Saúde | Humano Saúde',
    description:
      'Envie sua fatura e descubra em segundos quanto pode reduzir. Análise gratuita com Inteligência Artificial.',
    url: 'https://humanosaude.com.br/economizar',
    siteName: 'Humano Saúde',
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Economize até 40% no Plano de Saúde | Humano Saúde',
    description: 'Envie sua fatura e descubra em segundos quanto pode reduzir. Análise gratuita com IA.',
    images: [OG_IMAGE.url],
  },
  keywords: [
    'plano de saúde barato',
    'economizar plano de saúde',
    'reduzir plano de saúde',
    'calculadora plano de saúde',
    'comparar plano de saúde',
    'migrar plano de saúde',
    'plano de saúde empresarial',
    'plano de saúde PME',
  ],
};

export default function EconomizarPage() {
  return <CalculadoraEconomia />;
}
