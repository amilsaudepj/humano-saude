import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Links | Humano Saúde',
  description: 'Links oficiais: vendas, acessos (corretor, afiliado, cliente) e indicações. Economize no plano de saúde.',
  openGraph: {
    title: 'Links | Humano Saúde',
    description: 'Acesso rápido a todas as páginas oficiais: economizar, login corretor/afiliado, portal cliente e indicações.',
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
