'use client';

import { Target } from 'lucide-react';

export default function MetaAdsCorretorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Target className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Meta Ads</h1>
          <p className="text-sm text-white/50">Acompanhe suas campanhas Meta Ads</p>
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <Target className="h-12 w-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/40 text-sm">Em breve — Meta Ads em desenvolvimento</p>
      </div>
    </div>
  );
}
