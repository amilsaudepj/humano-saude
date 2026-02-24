'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCardMinimal } from '@/app/actions/crm-card-detail';
import { LeadCardDetailView } from '@/app/dashboard/corretor/crm/lead/[id]/page';
import { Loader2 } from 'lucide-react';

export default function AdminLeadCardPage() {
  const params = useParams();
  const cardId = params?.cardId as string;
  const [corretorId, setCorretorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardId) {
      setError('Card não informado');
      return;
    }
    getCardMinimal(cardId).then((res) => {
      if (res.success && res.data) {
        setCorretorId(res.data.corretor_id);
      } else {
        setError(res.error ?? 'Card não encontrado');
      }
    });
  }, [cardId]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center text-white/60">
          <p className="mb-4">{error}</p>
          <a
            href="/portal-interno-hks-2026/leads"
            className="text-[#D4AF37] hover:underline"
          >
            ← Voltar para Leads
          </a>
        </div>
      </div>
    );
  }

  if (!corretorId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3 text-white/60">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
          <p>Carregando card do lead...</p>
        </div>
      </div>
    );
  }

  return (
    <LeadCardDetailView
      cardId={cardId}
      corretorId={corretorId}
      backHref="/portal-interno-hks-2026/leads"
    />
  );
}
