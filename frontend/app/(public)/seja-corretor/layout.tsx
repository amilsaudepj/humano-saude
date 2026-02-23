import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/og-image';

export const metadata: Metadata = {
  title: 'Seja Corretor | Parceiro Humano Saúde',
  description:
    'Trabalhe como corretor parceiro: planos de saúde, seguros de vida e automóvel. Acesso a materiais, tabelas exclusivas e ferramentas para fechar mais negócios.',
  openGraph: {
    title: 'Seja Corretor | Parceiro Humano Saúde',
    description:
      'Seja corretor parceiro. Planos de saúde, seguros, materiais organizados e ferramentas para vender mais. Cadastre-se.',
    url: 'https://humanosaude.com.br/seja-corretor',
    siteName: 'Humano Saúde',
    images: [OG_IMAGE],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seja Corretor | Parceiro Humano Saúde',
    description:
      'Seja corretor parceiro. Planos de saúde, seguros, materiais e ferramentas para vender mais.',
    images: [OG_IMAGE.url],
  },
};

export default function SejaCorretorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
