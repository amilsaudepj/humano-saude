import type { Metadata } from 'next';

/** Página restrita: não indexar, não seguir. URL não divulgada (blindagem). */
export const metadata: Metadata = {
  title: 'Acesso restrito | Humano Saúde',
  description: 'Acesso à página restrita de links.',
  robots: { index: false, follow: false, noarchive: true },
};

export default function AcessoLinksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
