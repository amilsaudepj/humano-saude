import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import MetaPixel from "./components/MetaPixel";
import GoogleAnalytics from "./components/GoogleAnalytics";
import GoogleTagManager, { GoogleTagManagerNoScript } from "./components/GoogleTagManager";
import HotjarInit from "./components/HotjarInit";

// Inter para corpo de texto
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// JetBrains Mono para código
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Perpetua Titling MT está configurada em globals.css via @font-face
// Fallback para serif se não estiver instalada no sistema

export const metadata: Metadata = {
  metadataBase: new URL("https://humanosaude.com.br"),
  title: "Humano Saúde | Reduza até 40% no Plano de Saúde",
  description:
    "Especialistas em redução de custos de planos de saúde Individual, Familiar e Empresarial. Análise com IA em 10 minutos.",
  keywords: ["plano de saúde", "redução de custos", "plano empresarial", "MEI", "PME", "Humano Saúde"],
  authors: [{ name: "Humano Saúde" }],
  creator: "Humano Saúde",
  publisher: "Humano Saúde",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
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
    title: "Humano Saúde | Economia Inteligente em Planos de Saúde",
    description:
      "Reduza até 40% mantendo sua rede hospitalar. Atendimento especializado.",
    siteName: "Humano Saúde",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Humano Saúde - Corretora Especializada",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Humano Saúde | Reduza até 40% no Plano de Saúde",
    description: "Análise com IA em 10 minutos. Sem burocracia.",
    images: ["/og-image.png"],
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
        
        {/* Contentsquare / Hotjar One Tag */}
        <script src="https://t.contentsquare.net/uxa/bf79baf35fb2a.js" async />
        
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <GoogleTagManagerNoScript />
        <GoogleAnalytics />
        <HotjarInit />
        {children}
      </body>
    </html>
  );
}
