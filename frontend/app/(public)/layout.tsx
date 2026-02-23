import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/og-image';

export const metadata: Metadata = {
  title: 'Humano Saúde | Reduza até 40% no Plano de Saúde',
  description: 'Especialistas em redução de custos de planos de saúde Individual, Familiar e Empresarial. Análise com IA em 10 minutos.',
  keywords: [
    'plano de saúde barato',
    'redução plano de saúde',
    'plano empresarial',
    'Amil',
    'Bradesco Saúde',
    'Unimed Rio',
  ],
  openGraph: {
    title: 'Humano Saúde | Economia Inteligente em Planos de Saúde',
    description: 'Reduza até 40% mantendo sua rede hospitalar. Atendimento especializado.',
    url: 'https://humanosaude.com.br',
    siteName: 'Humano Saúde',
    images: [OG_IMAGE],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Humano Saúde | Reduza até 40% no Plano de Saúde',
    description: 'Análise com IA em 10 minutos. Sem burocracia.',
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/images/logos/icon-humano.png', sizes: 'any', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logos/icon-humano.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="font-montserrat">{children}</div>;
}
