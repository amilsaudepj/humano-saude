import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Indicar alguém | Humano Saúde',
  description: 'Indique uma pessoa para falar com nosso corretor. Preencha os dados e o corretor entrará em contato.',
  robots: 'noindex, nofollow',
};

export default function IndicarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
