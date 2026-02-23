import type { Metadata } from 'next';

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Humano Saúde - Corretora Especializada',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Humano Saúde | Reduza até 40% no Plano de Saúde',
    description: 'Análise com IA em 10 minutos. Sem burocracia.',
    images: ['/og-image.png'],
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
