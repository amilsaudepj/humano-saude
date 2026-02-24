'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getAfiliadoLogado, atualizarCadastroCompletoAfiliado } from '@/app/actions/corretor-afiliados';
import { Loader2, CheckCircle, Landmark, FileText, ShieldCheck, Camera, Video, X, ImageIcon, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import { TEXTO_TERMO_AFILIACAO, TITULO_TERMO } from './termo-afiliacao';

// ─── Tipo e componente de documento (anexar ou tirar foto) ─────────────────
interface DocFile {
  file: File | null;
  preview: string;
  status: 'empty' | 'selected' | 'uploading' | 'uploaded' | 'error';
  errorMsg?: string;
}

function DocCaptureCard({
  label,
  description,
  docFile,
  onFileSelect,
  onRemove,
}: {
  label: string;
  description: string;
  docFile: DocFile;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => setCameraError('Erro ao iniciar o vídeo.'));
    }
  }, [cameraActive]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `doc_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onFileSelect(file);
          stopCamera();
        }
      },
      'image/jpeg',
      0.9,
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx. 10MB)');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Use JPG, PNG, WebP ou PDF');
      return;
    }
    onFileSelect(file);
    e.target.value = '';
  };

  if (docFile.status === 'selected' || docFile.status === 'uploaded') {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 sm:p-5 transition-all">
        <div className="flex items-center gap-3 sm:gap-4">
          {docFile.preview ? (
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
              <img src={docFile.preview} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{docFile.file?.name ?? label}</p>
            <p className="text-xs text-white/40">
              {((docFile.file?.size ?? 0) / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => { onRemove(); stopCamera(); }}
            className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (cameraActive) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#D4AF37]/30 bg-black/40 p-4 transition-all">
        <p className="text-sm font-medium text-white mb-3">{label}</p>
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black mb-3">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={capturePhoto}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] text-black font-semibold text-sm"
          >
            <Camera className="h-4 w-4" />
            Capturar
          </button>
          <button
            type="button"
            onClick={stopCamera}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 p-4 sm:p-5 transition-all">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/5 flex items-center justify-center">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white/30" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-white/40 mt-0.5">{description}</p>
        </div>
        {cameraError && <p className="text-xs text-red-400 text-center">{cameraError}</p>}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/20"
          >
            <Video className="h-4 w-4" />
            Tirar foto
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            Enviar arquivo
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        <p className="text-[11px] text-white/25">JPG, PNG, WebP ou PDF até 10MB</p>
      </div>
    </div>
  );
}

const initialDocFile = (): DocFile => ({ file: null, preview: '', status: 'empty' });

export default function CompletarCadastroAfiliadoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [afiliado, setAfiliado] = useState<{
    id: string;
    nome: string;
    email: string | null;
    cadastro_completo: boolean | null;
    termo_assinado_em: string | null;
    banco_nome: string | null;
    banco_agencia: string | null;
    banco_conta: string | null;
    banco_tipo: string | null;
    pix: string | null;
    doc_anexo_url: string | null;
    doc_comprovante_residencia_url: string | null;
    termo_aceito: boolean | null;
  } | null>(null);
  const [banco_nome, setBanco_nome] = useState('');
  const [banco_agencia, setBanco_agencia] = useState('');
  const [banco_conta, setBanco_conta] = useState('');
  const [banco_tipo, setBanco_tipo] = useState<string>('');
  const [pix, setPix] = useState('');
  const [docIdentidade, setDocIdentidade] = useState<DocFile>(initialDocFile);
  const [docComprovante, setDocComprovante] = useState<DocFile>(initialDocFile);
  const [termo_aceito, setTermo_aceito] = useState(false);
  const [termoModalOpen, setTermoModalOpen] = useState(false);
  const [termoScrollLiberado, setTermoScrollLiberado] = useState(false);
  const termoScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAfiliadoLogado().then((res) => {
      if (res.success && res.afiliado) {
        setAfiliado(res.afiliado);
        setBanco_nome(res.afiliado.banco_nome ?? '');
        setBanco_agencia(res.afiliado.banco_agencia ?? '');
        setBanco_conta(res.afiliado.banco_conta ?? '');
        setBanco_tipo(res.afiliado.banco_tipo ?? '');
        setPix(res.afiliado.pix ?? '');
        setTermo_aceito(res.afiliado.termo_aceito ?? false);
        if (res.afiliado.doc_anexo_url) {
          setDocIdentidade((d) => ({ ...d, status: 'uploaded' as const }));
        }
        if ((res.afiliado as { doc_comprovante_residencia_url?: string | null }).doc_comprovante_residencia_url) {
          setDocComprovante((d) => ({ ...d, status: 'uploaded' as const }));
        }
      }
      setLoading(false);
    });
  }, []);

  const handleIdentidadeSelect = (file: File) => {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    setDocIdentidade({ file, preview, status: 'selected' });
  };
  const handleComprovanteSelect = (file: File) => {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    setDocComprovante({ file, preview, status: 'selected' });
  };

  const openTermoModal = () => {
    setTermoScrollLiberado(false);
    setTermoModalOpen(true);
  };

  const handleTermoScroll = useCallback(() => {
    const el = termoScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 20;
    setTermoScrollLiberado((prev) => prev || atBottom);
  }, []);

  const handleAceitarTermo = () => {
    setTermo_aceito(true);
    setTermoModalOpen(false);
    toast.success('Termo aceito. Agora você pode concluir o cadastro.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termo_aceito) {
      toast.error('Aceite o termo para concluir o cadastro.');
      return;
    }

    let docIdentidadeUrl = (docIdentidade.status === 'uploaded' && afiliado?.doc_anexo_url) ? afiliado.doc_anexo_url : '';
    let docComprovanteUrl = (docComprovante.status === 'uploaded' && afiliado) ? (afiliado as { doc_comprovante_residencia_url?: string }).doc_comprovante_residencia_url ?? '' : '';

    if (docIdentidade.file) {
      setDocIdentidade((d) => ({ ...d, status: 'uploading' }));
      const form = new FormData();
      form.append('tipo', 'identidade');
      form.append('file', docIdentidade.file);
      const res = await fetch('/api/afiliado/documentos', { method: 'POST', body: form });
      const data = await res.json();
      setDocIdentidade((d) => ({ ...d, status: data.success ? 'uploaded' : 'error', errorMsg: data.error }));
      if (data.success && data.url) docIdentidadeUrl = data.url;
      else if (!data.success) {
        toast.error(data.error || 'Erro ao enviar documento de identidade.');
        return;
      }
    }
    if (docComprovante.file) {
      setDocComprovante((d) => ({ ...d, status: 'uploading' }));
      const form = new FormData();
      form.append('tipo', 'comprovante_residencia');
      form.append('file', docComprovante.file);
      const res = await fetch('/api/afiliado/documentos', { method: 'POST', body: form });
      const data = await res.json();
      setDocComprovante((d) => ({ ...d, status: data.success ? 'uploaded' : 'error', errorMsg: data.error }));
      if (data.success && data.url) docComprovanteUrl = data.url;
      else if (!data.success) {
        toast.error(data.error || 'Erro ao enviar comprovante de residência.');
        return;
      }
    }

    setSaving(true);
    const res = await atualizarCadastroCompletoAfiliado({
      banco_nome: banco_nome.trim() || undefined,
      banco_agencia: banco_agencia.trim() || undefined,
      banco_conta: banco_conta.trim() || undefined,
      banco_tipo: (banco_tipo as 'conta_corrente' | 'conta_poupanca') || undefined,
      pix: pix.trim() || undefined,
      doc_anexo_url: docIdentidadeUrl || undefined,
      doc_comprovante_residencia_url: docComprovanteUrl || undefined,
      termo_aceito: true,
    });
    setSaving(false);
    if (res.success) {
      toast.success('Cadastro completo atualizado!');
      setAfiliado((a) => (a ? { ...a, cadastro_completo: true, termo_assinado_em: new Date().toISOString() } : null));
    } else {
      toast.error(res.error || 'Erro ao salvar.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!afiliado) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-white/70">Sessão inválida. Faça login novamente.</p>
        <Link href="/dashboard/afiliado/login" className="mt-4 inline-block text-[#D4AF37] hover:underline">
          Ir para login
        </Link>
      </div>
    );
  }

  if (afiliado.cadastro_completo) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Cadastro completo</h2>
        <p className="text-white/60 mb-6">Seus dados bancários e termo já foram registrados.</p>
        <Link href="/dashboard/afiliado" className="inline-block rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#F6E05E]">
          Voltar ao painel
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Completar cadastro</h1>
      <p className="text-sm text-white/50 mb-6">
        Preencha os dados bancários, anexe os documentos e aceite o termo para receber comissões.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Dados bancários
          </h2>
          <div>
            <label className="block text-xs text-white/50 mb-1">Banco</label>
            <input
              type="text"
              value={banco_nome}
              onChange={(e) => setBanco_nome(e.target.value)}
              placeholder="Ex.: Itaú, Bradesco"
              className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:border-[#D4AF37]/40 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Agência</label>
              <input
                type="text"
                value={banco_agencia}
                onChange={(e) => setBanco_agencia(e.target.value)}
                placeholder="0000"
                className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:border-[#D4AF37]/40 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Conta</label>
              <input
                type="text"
                value={banco_conta}
                onChange={(e) => setBanco_conta(e.target.value)}
                placeholder="00000-0"
                className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:border-[#D4AF37]/40 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Tipo de conta</label>
            <select
              value={banco_tipo}
              onChange={(e) => setBanco_tipo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white focus:border-[#D4AF37]/40 outline-none"
            >
              <option value="">Selecione</option>
              <option value="conta_corrente">Conta corrente</option>
              <option value="conta_poupanca">Conta poupança</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Chave PIX (e-mail, CPF, telefone ou aleatória)</label>
            <input
              type="text"
              value={pix}
              onChange={(e) => setPix(e.target.value)}
              placeholder="Sua chave PIX"
              className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/30 focus:border-[#D4AF37]/40 outline-none"
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </h2>
          <div>
            <p className="text-xs text-white/50 mb-2">Identidade e CPF (CNH, RG ou outros)</p>
            <DocCaptureCard
              label="Identidade / CPF"
              description="CNH (frente e verso) ou RG (frente e verso)"
              docFile={docIdentidade}
              onFileSelect={handleIdentidadeSelect}
              onRemove={() => setDocIdentidade(initialDocFile())}
            />
          </div>
          <div>
            <p className="text-xs text-white/50 mb-2">Comprovante de residência</p>
            <DocCaptureCard
              label="Comprovante de residência"
              description="Conta de luz, água, etc. (até 3 meses)"
              docFile={docComprovante}
              onFileSelect={handleComprovanteSelect}
              onRemove={() => setDocComprovante(initialDocFile())}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Termo de adesão
          </h2>
          {termo_aceito ? (
            <div className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
              <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
              <span className="text-sm text-white/90">Termo aceito. Você pode concluir o cadastro abaixo.</span>
              <button
                type="button"
                onClick={openTermoModal}
                className="text-xs text-[#D4AF37] hover:underline ml-auto"
              >
                Ler novamente
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-white/70 mb-3">
                É obrigatório ler e aceitar o termo de adesão ao programa de afiliados. Abra o termo, role até o final e aceite para continuar.
              </p>
              <button
                type="button"
                onClick={openTermoModal}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/20 transition-all"
              >
                <ScrollText className="h-4 w-4" />
                Ler e aceitar os termos
              </button>
            </div>
          )}
        </div>

        {/* Modal do termo — só libera aceite após rolar até o fim */}
        {termoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setTermoModalOpen(false)}>
            <div
              className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
                  {TITULO_TERMO}
                </h3>
                <button
                  type="button"
                  onClick={() => setTermoModalOpen(false)}
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div
                ref={termoScrollRef}
                onScroll={handleTermoScroll}
                className="flex-1 overflow-y-auto px-5 py-4 text-sm text-white/80 whitespace-pre-line leading-relaxed"
              >
                {TEXTO_TERMO_AFILIACAO}
              </div>
              <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3">
                <p className="text-xs text-white/40">
                  {termoScrollLiberado ? 'Você rolou até o final. Pode aceitar.' : 'Role até o final do termo para liberar o aceite.'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTermoModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleAceitarTermo}
                    disabled={!termoScrollLiberado}
                    className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#F6E05E] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Aceitar e continuar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !termo_aceito}
          className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#F6E05E] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Concluir cadastro'}
        </button>
      </form>

      <p className="text-xs text-white/30 mt-6 text-center">
        <Link href="/dashboard/afiliado" className="text-[#D4AF37]/70 hover:underline">Voltar ao painel</Link>
      </p>
    </div>
  );
}
