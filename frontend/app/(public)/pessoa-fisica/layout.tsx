import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/og-image';

export const metadata: Metadata = {
  title: 'Plano de Saúde para Pessoa Física | Humano Saúde',
  description:
    'Contratação inteligente de plano de saúde individual e familiar. Economia, segurança e rede de qualidade. Cotação em minutos.',
  keywords: [
    'plano de saúde pessoa física',
    'plano de saúde individual',
    'plano de saúde familiar',
    'contratar plano de saúde',
    'cotação plano de saúde',
  ],
  openGraph: {
    title: 'Plano de Saúde para Pessoa Física | Humano Saúde',
    description:
      'Contratação inteligente de plano de saúde. Economia e segurança com a melhor rede.',
    url: 'https://humanosaude.com.br/pessoa-fisica',
    siteName: 'Humano Saúde',
    images: [OG_IMAGE],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plano de Saúde para Pessoa Física | Humano Saúde',
    description: 'Economia e segurança. Cotação em minutos.',
    images: [OG_IMAGE.url],
  },
  robots: { index: true, follow: true },
};

export default function PessoaFisicaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="font-montserrat min-h-screen antialiased"
      style={{
        background: '#FFFFFF',
        color: '#1a1a1a',
      }}
    >
      {children}
    </div>
  );
}
