'use client';

import { CheckSquare } from 'lucide-react';

export default function TarefasCorretorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
          <CheckSquare className="h-5 w-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Tarefas</h1>
          <p className="text-sm text-white/50">Gerencie suas tarefas e atividades</p>
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <CheckSquare className="h-12 w-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/40 text-sm">Em breve — gestão de tarefas em desenvolvimento</p>
      </div>
    </div>
  );
}
