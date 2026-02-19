'use client';

import { Briefcase, Sparkles } from 'lucide-react';

export default function DealsAdminPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase className="h-7 w-7 text-[#D4AF37]" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">Oportunidades</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black">NOVO</span>
        </div>
        <p className="text-white/60">Gestão de oportunidades comerciais — visão consolidada de todos os corretores</p>
      </div>

      <div className="flex items-center justify-center min-h-[400px] rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-[#D4AF37]/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/70 mb-2">Oportunidades — Visão Admin</h3>
          <p className="text-sm text-white/40 max-w-md">
            Acompanhe todas as oportunidades (deals) dos corretores, valores estimados, status e previsão de fechamento.
          </p>
        </div>
      </div>
    </div>
  );
}
