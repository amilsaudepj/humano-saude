import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { Toaster } from '@/components/ui/sonner';

// LPs têm fonte própria para não herdar os scripts de rastreamento do app principal.
// Os pixels do tenant são injetados dinamicamente nas próprias páginas via RSC.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function LPsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
