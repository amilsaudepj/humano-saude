'use client';

import { useState } from 'react';
import { Download, CreditCard, CheckCircle2 } from 'lucide-react';

type Props = {
  selectedCount: number;
  onMarkPaid: (method: string) => void;
  onDownloadCSV: () => void;
  isPending: boolean;
};

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'ted', label: 'TED' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'deposito', label: 'Depósito' },
];

export function PaymentActions({ selectedCount, onMarkPaid, onDownloadCSV, isPending }: Props) {
  const [method, setMethod] = useState('pix');
  const [confirming, setConfirming] = useState(false);

  function handleConfirmPay() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onMarkPaid(method);
    setConfirming(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Baixar CSV */}
      <button
        onClick={onDownloadCSV}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Baixar Arquivo de Pagamento
      </button>

      {/* Separador visual */}
      <div className="h-6 w-px bg-white/10" />

      {/* Marcar como Pago */}
      <div className="flex items-center gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="rounded-md border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <button
          onClick={handleConfirmPay}
          disabled={selectedCount === 0 || isPending}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            confirming
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
          }`}
        >
          {confirming ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Confirmar Pagamento ({selectedCount})
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Marcar como Pago ({selectedCount})
            </>
          )}
        </button>

        {confirming && (
          <button
            onClick={() => setConfirming(false)}
            className="text-xs text-gray-400 hover:text-white"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
