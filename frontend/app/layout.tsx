import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { OG_IMAGE } from "@/lib/og-image";
import MetaPixel from "./components/MetaPixel";
import GoogleAnalytics from "./components/GoogleAnalytics";
import GoogleTagManager, { GoogleTagManagerNoScript } from "./components/GoogleTagManager";
import { Analytics } from "@vercel/analytics/next";

// Fontes via link (evita module-not-found de next/font em build/dev)
// Fallback para serif se não estiver instalada no sistema

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br'),
  title: {
    default: "Humano Saúde",
    template: "%s | Humano Saúde",
  },
  description: "Reduza até 40% no plano de saúde. Cotação e análise para MEI, PME e empresas.",
  keywords: ["plano de saúde", "economia", "cotação", "MEI", "PME", "empresarial"],
  authors: [{ name: "Humano Saúde" }],
  creator: "Humano Saúde",
  publisher: "Humano Saúde",
  icons: {
    icon: [
      { url: '/images/logos/icon-humano.png', sizes: 'any', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logos/icon-humano.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Humano Saúde',
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://humanosaude.com.br",
    title: "Humano Saúde | Reduza até 40% no Plano de Saúde",
    description: "Reduza até 40% no plano de saúde. Cotação e análise para MEI, PME e empresas.",
    siteName: "Humano Saúde",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#D4AF37',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google Tag Manager */}
        <GoogleTagManager />
        {/* Fontes: Inter + JetBrains Mono + Montserrat (evita next/font module-not-found) */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Montserrat:wght@300;400;600;700;800&display=swap" />
        {/* Contentsquare / Hotjar One Tag */}
        <script src="https://t.contentsquare.net/uxa/bf79baf35fb2a.js" async />
        
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
      </head>
      <body className="font-sans antialiased">
        <GoogleTagManagerNoScript />
        <GoogleAnalytics />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
