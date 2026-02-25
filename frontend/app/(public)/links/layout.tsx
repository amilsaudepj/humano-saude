import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Links | Humano Saúde',
  description: 'Linktree oficial: Humano Saúde Empresas, Pessoa Física, Calculadora de Planos e Indique um Cliente.',
  openGraph: {
    title: 'Links | Humano Saúde',
    description: 'Links oficiais: Empresas, Pessoa Física, Calculadora de Planos e Indique um Cliente.',
    url: 'https://humanosaude.com.br/links',
    siteName: 'Humano Saúde',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function LinksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
