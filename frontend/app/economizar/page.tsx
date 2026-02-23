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
    'Envie sua fatura ou os dados do seu plano e veja em minutos quanto pode economizar. Metodologia simples: envio, análise com IA e resultado com a economia estimada. Até 40% de redução.',
  openGraph: {
    title: 'Economize até 40% no Plano de Saúde | Humano Saúde',
    description:
      'Envie sua fatura ou dados do plano e veja em minutos sua economia. Metodologia: envio, análise com IA e resultado. Gratuito.',
    url: 'https://humanosaude.com.br/economizar',
    siteName: 'Humano Saúde',
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Economize até 40% no Plano de Saúde | Humano Saúde',
    description:
      'Envie sua fatura ou dados do plano e veja em minutos sua economia. Metodologia: envio, análise com IA e resultado.',
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
