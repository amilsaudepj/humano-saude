'use client';

import { useState, useEffect } from 'react';
import { Mail, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusConfirmacaoEmail, reenviarEmailConfirmacaoCorretor } from '@/app/actions/corretor-ops';

export default function BannerEmailNaoConfirmado({ corretorId }: { corretorId: string }) {
  const [status, setStatus] = useState<{
    precisaConfirmar: boolean;
    diasRestantes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reenviando, setReenviando] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await getStatusConfirmacaoEmail(corretorId);
      if (cancelled) return;
      setLoading(false);
      if (res.success && res.data) {
        setStatus({
          precisaConfirmar: res.data.precisaConfirmar,
          diasRestantes: res.data.diasRestantes,
        });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [corretorId]);

  async function handleReenviar() {
    setReenviando(true);
    const res = await reenviarEmailConfirmacaoCorretor(corretorId);
    setReenviando(false);
    if (res.success) {
      toast.success('E-mail de confirmação reenviado. Verifique sua caixa de entrada.');
    } else {
      toast.error(res.error || 'Erro ao reenviar e-mail');
    }
  }

  if (loading || !status || !status.precisaConfirmar) {
    return null;
  }

  const diasRestantes = status.diasRestantes;
  const textoDias =
    diasRestantes > 1
      ? `Faltam ${diasRestantes} dias para confirmar seu e-mail. Após 7 dias sem confirmação, sua conta será suspensa.`
      : diasRestantes === 1
        ? 'Falta 1 dia para confirmar seu e-mail. Após 7 dias sem confirmação, sua conta será suspensa.'
        : 'Confirme seu e-mail o quanto antes. Após 7 dias sem confirmação, sua conta será suspensa.';

  return (
    <div
      className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-xl"
      role="alert"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
            <Mail className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-amber-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              E-mail não confirmado
            </p>
            <p className="mt-1 text-sm text-white/80">{textoDias}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReenviar}
          disabled={reenviando}
          className="shrink-0 rounded-xl bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
        >
          {reenviando ? (
            <>
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            'Reenviar e-mail de confirmação'
          )}
        </button>
      </div>
    </div>
  );
}
