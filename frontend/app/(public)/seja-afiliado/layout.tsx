import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/og-image';

export const metadata: Metadata = {
  title: 'Seja Afiliado | Indique e Ganhe | Humano Saúde',
  description:
    'Seja afiliado: só indicar, sem atender e sem vender. Compartilhe seu link, a gente cuida do resto. Programa de afiliados Humano Saúde.',
  openGraph: {
    title: 'Seja Afiliado | Indique e Ganhe | Humano Saúde',
    description:
      'Só indicar. Sem atender. Sem vender. Receba seu link exclusivo e indique quem pode economizar em plano de saúde.',
    url: 'https://humanosaude.com.br/seja-afiliado',
    siteName: 'Humano Saúde',
    images: [OG_IMAGE],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seja Afiliado | Indique e Ganhe | Humano Saúde',
    description:
      'Só indicar. Sem atender. Sem vender. Programa de afiliados Humano Saúde.',
    images: [OG_IMAGE.url],
  },
};

export default function SejaAfiliadoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
