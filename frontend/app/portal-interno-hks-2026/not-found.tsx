'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft, Shield } from 'lucide-react';

export default function PortalNotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0a0a0a_0%,_#050505_50%,_#000000_100%)]" />
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] bg-[#D4AF37]/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] bg-[#F6E05E]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Logo sem fundo (ícone oficial) */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/images/logos/icon-humano.png"
              alt="Humano Saúde"
              width={48}
              height={48}
              className="h-12 w-auto object-contain"
            />
            <span className="text-lg font-bold text-white tracking-tight">Humano Saúde</span>
          </Link>
        </div>

        {/* 404 */}
        <div className="mb-8">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] mb-4">
            404
          </h1>
          <h2 className="text-2xl font-bold text-white mb-3">
            Página não encontrada
          </h2>
          <p className="text-lg text-slate-400">
            Esta seção do portal não existe ou ainda está em desenvolvimento.
          </p>
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/portal-interno-hks-2026"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-slate-900 font-bold rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all duration-300"
          >
            <Shield className="w-5 h-5" />
            Voltar ao Cockpit
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            <Home className="w-5 h-5" />
            Ir para Home
          </Link>
        </div>

        {/* Dica */}
        <div className="mt-12 p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-slate-400 text-sm">
            💡 Use o menu lateral para navegar pelas seções disponíveis do portal.
          </p>
        </div>
      </div>
    </div>
  );
}
