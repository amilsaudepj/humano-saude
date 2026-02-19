'use client';

import { Receipt } from 'lucide-react';

export default function PlanosCorretorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
          <Receipt className="h-5 w-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Tabela de Preços</h1>
          <p className="text-sm text-white/50">Consulte preços e planos das operadoras</p>
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <Receipt className="h-12 w-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/40 text-sm">Em breve — tabela de preços em desenvolvimento</p>
      </div>
    </div>
  );
}
