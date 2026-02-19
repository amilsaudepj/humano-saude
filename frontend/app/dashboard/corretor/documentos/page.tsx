'use client';

import { FileArchive } from 'lucide-react';

export default function DocumentosCorretorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <FileArchive className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Documentos</h1>
          <p className="text-sm text-white/50">Gerencie seus documentos e arquivos</p>
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <FileArchive className="h-12 w-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/40 text-sm">Em breve — gestão de documentos em desenvolvimento</p>
      </div>
    </div>
  );
}
