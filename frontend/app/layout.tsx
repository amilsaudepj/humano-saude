import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import MetaPixel from "./components/MetaPixel";
import GoogleAnalytics from "./components/GoogleAnalytics";
import GoogleTagManager, { GoogleTagManagerNoScript } from "./components/GoogleTagManager";

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
  title: "Humano Saúde - Enterprise",
  description: "Sistema completo de gestão e cotações para corretores de saúde com IA - Private Banking",
  keywords: ["saúde", "corretora", "cotações", "IA", "broker", "private banking", "luxo"],
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
    title: "Humano Saúde - Broker OS",
    description: "Sistema completo de gestão e cotações para corretores de saúde com IA",
    siteName: "Humano Saúde",
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
        {children}
      </body>
    </html>
  );
}
