'use client';

import { CalendarClock, Sparkles } from 'lucide-react';

export default function RenovacoesAdminPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CalendarClock className="h-7 w-7 text-[#D4AF37]" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">Renovações</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400">3</span>
        </div>
        <p className="text-white/60">Controle de renovações de contratos e planos de saúde</p>
      </div>

      <div className="flex items-center justify-center min-h-[400px] rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-[#D4AF37]/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/70 mb-2">Renovações — Visão Admin</h3>
          <p className="text-sm text-white/40 max-w-md">
            Acompanhe contratos próximos do vencimento, gerencie renovações pendentes e automatize alertas para corretores.
          </p>
        </div>
      </div>
    </div>
  );
}
