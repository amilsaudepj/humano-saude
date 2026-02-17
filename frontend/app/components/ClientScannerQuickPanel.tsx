'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ScanLine, UploadCloud } from 'lucide-react';

const ScannerDocumentos = dynamic(() => import('@/app/components/ScannerDocumentos'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
      <Loader2 className="h-4 w-4 animate-spin" />
      Carregando Scanner Inteligente...
    </div>
  ),
});

type ScannerContext = 'admin' | 'corretor';

export function ClientScannerQuickPanel({
  context,
  corretorId,
  leadId,
  leadName,
  compact = false,
}: {
  context: ScannerContext;
  corretorId?: string | null;
  leadId?: string | null;
  leadName?: string | null;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={`space-y-3 ${compact ? '' : 'rounded-xl border border-white/10 bg-black/20 p-4'}`}>
        {!compact && (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-[#D4AF37]" />
              Scanner Inteligente do Cliente
            </h4>
            <p className="text-xs text-white/60">
              Suba toda a documentação do cliente com o fluxo completo (ScanFULL, validações e checklist).
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="bg-[#D4AF37] text-black hover:bg-[#E8C25B]"
            size={compact ? 'sm' : 'default'}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Abrir scanner no painel
          </Button>
        </div>

        {(leadName || leadId) && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            {leadName && (
              <Badge variant="outline" className="border-white/20 bg-white/5 text-white/75">
                Cliente: {leadName}
              </Badge>
            )}
            {leadId && (
              <Badge variant="outline" className="border-white/20 bg-white/5 text-white/55 font-mono">
                Lead ID: {leadId}
              </Badge>
            )}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[98vw] max-w-[1680px] sm:max-w-[98vw] h-[94vh] overflow-hidden border-white/15 bg-[#0a0a0a] p-0 text-white">
          <DialogHeader className="border-b border-white/10 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-white">
              <ScanLine className="h-5 w-5 text-[#D4AF37]" />
              Scanner Inteligente
            </DialogTitle>
            <p className="text-xs text-white/55">
              Use este fluxo para anexar documentos completos e finalizar checklist de proposta do cliente.
            </p>
          </DialogHeader>

          <div className="h-[calc(94vh-84px)] overflow-y-auto px-4 py-4">
            <ScannerDocumentos
              corretorId={corretorId || undefined}
              registrarFilaProposta
              permitirLeadExistente
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ClientScannerQuickPanel;
