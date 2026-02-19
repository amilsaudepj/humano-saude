'use client';

import { FileText, Sparkles } from 'lucide-react';

export default function ExtratoAdminPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-7 w-7 text-[#D4AF37]" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">Extrato Financeiro</h1>
        </div>
        <p className="text-white/60">Extrato detalhado de movimentações financeiras</p>
      </div>

      <div className="flex items-center justify-center min-h-[400px] rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-green-400/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/70 mb-2">Extrato — Visão Admin</h3>
          <p className="text-sm text-white/40 max-w-md">
            Visualize extratos financeiros consolidados de todos os corretores, filtros por período e exportação.
          </p>
        </div>
      </div>
    </div>
  );
}
