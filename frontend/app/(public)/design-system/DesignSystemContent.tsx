'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const BASE = '/images/id-visual';

const LOGOS = [
  { name: 'LOGO 1', img: 'LOGO 1.png', pdf: 'LOGO 1.pdf' },
  { name: 'LOGO 2', img: 'LOGO 2.png', pdf: 'LOGO 2.pdf' },
  { name: 'LOGO 3', img: 'LOGO 3.png', pdf: 'LOGO 3.pdf' },
  { name: 'LOGO 1 (sem fundo)', img: 'LOGO 1 SEM FUNDO.png' },
  { name: 'LOGO 2 (sem fundo)', img: 'LOGO 2 SEM FUNDO.png' },
  { name: 'LOGO 3 (sem fundo)', img: 'LOGO 3 SEM FUNDO.png' },
];

const PDFS = [
  { name: 'Manual de Identidade Visual', file: 'HUMANO SAÚDE IDENTIDADE.pdf' },
  { name: 'Cartão de visita (frente)', file: 'frente cartão.pdf' },
  { name: 'Cartão de visita (verso)', file: 'cartao verso.pdf' },
];

const COLORS = [
  { name: 'Dourado principal', hex: '#B8941F', usage: 'CTAs, destaques, bordas' },
  { name: 'Dourado tema', hex: '#D4AF37', usage: 'Ícones, links, tema PWA' },
  { name: 'Dourado gradiente (início)', hex: '#bf953f', usage: 'Gradientes e sombras' },
  { name: 'Dourado gradiente (fim)', hex: '#aa771c', usage: 'Gradientes' },
  { name: 'Preto', hex: '#000000', usage: 'Texto principal, fundos' },
  { name: 'Cinza escuro', hex: '#1a1a1a', usage: 'Texto secundário' },
  { name: 'Cinza médio', hex: '#646464', usage: 'Legendas' },
  { name: 'Cinza claro', hex: '#f9fafb', usage: 'Fundos de seção' },
];

function enc(s: string) {
  return encodeURIComponent(s);
}

export default function DesignSystemContent() {
  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logos/logo-humano-saude-dourado.png"
              alt="Humano Saúde"
              width={140}
              height={48}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-[#B8941F] hover:underline"
          >
            ← Voltar ao site
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        <p className="text-gray-600 text-lg">
          Use esta página como referência para materiais de divulgação, peças e canais.
          Mantenha cores, logos e tipografia consistentes.
        </p>

        <section>
          <h2 className="text-2xl font-black text-black mb-2">Paleta de cores</h2>
          <p className="text-gray-600 mb-6">
            Cores oficiais da marca. Prefira o dourado principal (#B8941F) em CTAs e destaques no site.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {COLORS.map((c) => (
              <div
                key={c.hex}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div
                  className="h-16 rounded-lg mb-3 border border-gray-100"
                  style={{ backgroundColor: c.hex }}
                />
                <p className="font-bold text-black text-sm">{c.name}</p>
                <p className="font-mono text-xs text-gray-500">{c.hex}</p>
                <p className="text-xs text-gray-600 mt-1">{c.usage}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black text-black mb-2">Tipografia</h2>
          <p className="text-gray-600 mb-4">
            Fonte principal: <strong className="text-black">Montserrat</strong> (títulos e corpo).
            Fonte secundária para números/dados: Inter ou JetBrains Mono.
          </p>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <p className="text-4xl font-black text-black">Título Black</p>
            <p className="text-2xl font-bold text-black">Título Bold</p>
            <p className="text-lg font-semibold text-black">Subtítulo Semibold</p>
            <p className="text-base text-gray-700">Corpo de texto em cinza.</p>
            <p className="text-sm text-gray-500">Legendas e auxiliar.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black text-black mb-2">Logos</h2>
          <p className="text-gray-600 mb-6">
            Use sempre a versão em alta resolução. Em fundos escuros, prefira a versão &quot;sem fundo&quot; quando disponível.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {LOGOS.map((logo) => (
              <div
                key={logo.name}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col items-center"
              >
                <div className="relative w-full aspect-[2/1] bg-gray-100 rounded-lg flex items-center justify-center p-4">
                  <img
                    src={`${BASE}/${enc(logo.img)}`}
                    alt={logo.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <p className="font-semibold text-black text-sm mt-3 text-center">{logo.name}</p>
                <div className="flex gap-2 mt-2">
                  <a
                    href={`${BASE}/${enc(logo.img)}`}
                    download
                    className="text-xs text-[#B8941F] hover:underline"
                  >
                    PNG
                  </a>
                  {logo.pdf && (
                    <>
                      <span className="text-gray-300">|</span>
                      <a
                        href={`${BASE}/${enc(logo.pdf)}`}
                        download
                        className="text-xs text-[#B8941F] hover:underline"
                      >
                        PDF
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black text-black mb-2">Materiais em PDF</h2>
          <p className="text-gray-600 mb-6">
            Manual de identidade e artes de cartão de visita para download.
          </p>
          <ul className="space-y-3">
            {PDFS.map((item) => (
              <li key={item.file}>
                <a
                  href={`${BASE}/${enc(item.file)}`}
                  download
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-black font-medium hover:border-[#B8941F] hover:bg-[#B8941F]/5 transition-colors"
                >
                  <span className="text-[#B8941F]">↓</span>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-black text-black mb-2">Boas práticas</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Não altere proporções nem cores dos logos.</li>
            <li>Mínimo de área de respiro ao redor do logo (recomendado: altura do &quot;H&quot;).</li>
            <li>Em fundos coloridos, use a versão &quot;sem fundo&quot; (PNG com transparência).</li>
            <li>Mantenha contraste suficiente para acessibilidade (WCAG).</li>
            <li>WhatsApp oficial: use o verde #25D366 apenas em botões de contato.</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-500">
        Humano Saúde · Design System · Uso interno e parceiros
      </footer>
    </>
  );
}
