import type { Metadata } from 'next';
import '../globals.css';
import { Toaster } from '@/components/ui/sonner';

// LPs têm fonte própria para não herdar os scripts de rastreamento do app principal.
// Os pixels do tenant são injetados dinamicamente nas próprias páginas via RSC.
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function LPsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
