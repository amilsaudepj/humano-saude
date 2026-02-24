'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UsersRound,
  UserPlus,
  Copy,
  Link2,
  Loader2,
  Check,
  Power,
  PowerOff,
  Mail,
  Phone,
  FileUp,
  Sparkles,
  X,
} from 'lucide-react';
import { useCorretorId } from '../hooks/useCorretorToken';
import { listarAfiliados, criarAfiliado, criarAfiliadoComDocumento, toggleAfiliadoAtivo, type Afiliado } from '@/app/actions/corretor-afiliados';
import { toast } from 'sonner';

type DocFlowStep = 'upload' | 'form';
interface ExtractedData {
  nome_completo?: string | null;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';

export default function AfiliadosPage() {
  const corretorId = useCorretorId();
  const router = useRouter();
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [criando, setCriando] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [copiadoEconomizarId, setCopiadoEconomizarId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [copiadoLp, setCopiadoLp] = useState(false);

  // Fluxo: cadastrar com documento (IA)
  const [showDocFlow, setShowDocFlow] = useState(false);
  const [docFlowStep, setDocFlowStep] = useState<DocFlowStep>('upload');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUrl, setDocUrl] = useState('');
  const [docExtracting, setDocExtracting] = useState(false);
  const [docExtracted, setDocExtracted] = useState<ExtractedData | null>(null);
  const [docNome, setDocNome] = useState('');
  const [docCpf, setDocCpf] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docTelefone, setDocTelefone] = useState('');
  const [docCriando, setDocCriando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAfiliados = useCallback(async () => {
    if (!corretorId) return;
    setLoading(true);
    const result = await listarAfiliados(corretorId);
    if (result.success && result.data) setAfiliados(result.data);
    setLoading(false);
  }, [corretorId]);

  useEffect(() => {
    if (corretorId === null) {
      router.replace('/dashboard/corretor/login');
      return;
    }
    if (corretorId) fetchAfiliados();
  }, [corretorId, router, fetchAfiliados]);

  useEffect(() => {
    if (!corretorId) return;
    fetch('/api/corretor/perfil')
      .then((res) => res.json())
      .then((data) => {
        if (data?.corretor?.slug) setSlug(data.corretor.slug);
      })
      .catch(() => {});
  }, [corretorId]);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!corretorId || criando) return;
    setCriando(true);
    const result = await criarAfiliado(corretorId, { nome: nome.trim(), email: email.trim() || undefined, telefone: telefone.trim() || undefined });
    setCriando(false);
    if (result.success && result.afiliado) {
      setAfiliados((prev) => [result.afiliado!, ...prev]);
      setNome('');
      setEmail('');
      setTelefone('');
      setShowForm(false);
      if (result.link) {
        await navigator.clipboard.writeText(result.link);
        toast.success('Afiliado cadastrado! Link copiado para a área de transferência.');
      } else {
        toast.success('Afiliado cadastrado!');
      }
    } else {
      toast.error(result.error || 'Erro ao cadastrar');
    }
  };

  const handleToggleAtivo = async (afiliado: Afiliado) => {
    if (!corretorId) return;
    const result = await toggleAfiliadoAtivo(afiliado.id, corretorId);
    if (result.success) {
      setAfiliados((prev) => prev.map((a) => (a.id === afiliado.id ? { ...a, ativo: !a.ativo } : a)));
      toast.success(afiliado.ativo ? 'Afiliado desativado.' : 'Afiliado ativado.');
    } else {
      toast.error(result.error);
    }
  };

  const copyLinkIndicar = (token: string) => {
    const link = `${BASE_URL}/indicar?ref=${token}`;
    navigator.clipboard.writeText(link);
    setCopiadoId(token);
    toast.success('Link "Indicar cliente" copiado!');
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const copyLinkEconomizar = (token: string) => {
    const link = `${BASE_URL}/economizar/afiliado/${token}`;
    navigator.clipboard.writeText(link);
    setCopiadoEconomizarId(token);
    toast.success('Link "Economizar" copiado! Envie ao cliente.');
    setTimeout(() => setCopiadoEconomizarId(null), 2000);
  };

  const copyLpLink = () => {
    if (!slug) return;
    const link = `${BASE_URL}/seja-afiliado/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiadoLp(true);
    toast.success('Link da LP copiado!');
    setTimeout(() => setCopiadoLp(false), 2000);
  };

  const fecharDocFlow = () => {
    setShowDocFlow(false);
    setDocFlowStep('upload');
    setDocFile(null);
    setDocUrl('');
    setDocExtracted(null);
    setDocNome('');
    setDocCpf('');
    setDocEmail('');
    setDocTelefone('');
  };

  const processarDocumento = async (file: File) => {
    if (!corretorId) return;
    setDocFile(file);
    setDocExtracting(true);
    setDocExtracted(null);
    const formDataPdf = new FormData();
    formDataPdf.append('file', file);
    formDataPdf.append('context', JSON.stringify({ scope: 'beneficiario', doc_type: 'identidade_cpf' }));
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    try {
      const [resPdf, resUpload] = await Promise.all([
        fetch('/api/pdf', { method: 'POST', body: formDataPdf, credentials: 'include' }),
        fetch('/api/corretor/afiliado-documento/upload', { method: 'POST', body: formDataUpload, credentials: 'include' }),
      ]);
      const dataPdf = resPdf.ok ? await resPdf.json() : null;
      const dataUpload = resUpload.ok ? await resUpload.json() : null;
      if (dataPdf && typeof dataPdf === 'object') {
        setDocExtracted({
          nome_completo: dataPdf.nome_completo ?? null,
          cpf: dataPdf.cpf ?? null,
          email: dataPdf.email ?? null,
          telefone: dataPdf.telefone ?? null,
        });
        setDocNome((dataPdf.nome_completo || '').trim());
        setDocCpf((dataPdf.cpf || '').toString().replace(/\D/g, '').slice(0, 11));
        setDocEmail((dataPdf.email || '').trim());
        setDocTelefone((dataPdf.telefone || '').toString().replace(/\D/g, '').slice(-11));
      }
      if (dataUpload?.url) setDocUrl(dataUpload.url);
      setDocFlowStep('form');
      if (!dataPdf && !dataUpload?.url) toast.error('Não foi possível ler o documento. Preencha os dados manualmente.');
      else if (dataPdf) toast.success('Dados extraídos pela IA. Confira e informe e-mail e telefone.');
    } catch {
      toast.error('Erro ao processar documento. Tente novamente.');
    } finally {
      setDocExtracting(false);
    }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!corretorId || docCriando) return;
    const tel = docTelefone.replace(/\D/g, '');
    if (tel.length < 10) {
      toast.error('Informe o telefone com DDD.');
      return;
    }
    if (!docEmail.trim()) {
      toast.error('Informe o e-mail do afiliado.');
      return;
    }
    setDocCriando(true);
    const result = await criarAfiliadoComDocumento(corretorId, {
      nome: docNome.trim(),
      cpf: docCpf.trim() || undefined,
      email: docEmail.trim(),
      telefone: docTelefone.trim(),
      doc_anexo_url: docUrl || undefined,
    });
    setDocCriando(false);
    if (result.success && result.afiliado) {
      setAfiliados((prev) => [result.afiliado!, ...prev]);
      fecharDocFlow();
      if (result.link) {
        await navigator.clipboard.writeText(result.link);
        toast.success('Afiliado cadastrado com documento! Link copiado.');
      } else {
        toast.success('Afiliado cadastrado!');
      }
    } else {
      toast.error(result.error || 'Erro ao cadastrar');
    }
  };

  if (!corretorId) return null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UsersRound className="h-7 w-7 text-[#D4AF37]" />
            Meus afiliados
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Cadastre pessoas que vão indicar leads para você. Cada uma recebe um link exclusivo; os leads indicados caem na sua lista de indicações.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#F6E05E] transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            {showForm ? 'Cancelar' : 'Cadastrar afiliado'}
          </button>
          <button
            type="button"
            onClick={() => setShowDocFlow(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37] font-bold hover:bg-[#D4AF37]/20 transition-colors"
          >
            <FileUp className="h-5 w-5" />
            Cadastrar com documento (IA)
          </button>
        </div>
      </div>

      {slug && (
        <div className="mb-8 p-6 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/20">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#D4AF37]" />
            Link da LP para captar afiliados
          </h2>
          <p className="text-sm text-white/60 mb-3">
            Compartilhe esta página com quem você quer que seja seu afiliado. Quem acessar verá a mesma LP &quot;Seja afiliado&quot; e, ao clicar em &quot;Quero indicar&quot;, já ficará vinculado a você.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="text-sm px-3 py-2 rounded-xl bg-black/30 text-white/90 truncate max-w-full sm:max-w-[400px]">
              {BASE_URL}/seja-afiliado/{slug}
            </code>
            <button
              type="button"
              onClick={copyLpLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#F6E05E] text-sm transition-colors"
            >
              {copiadoLp ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiadoLp ? 'Copiado' : 'Copiar link'}
            </button>
          </div>
        </div>
      )}

      {showDocFlow && (
        <div className="mb-8 p-6 rounded-2xl bg-white/[0.03] border border-[#D4AF37]/20 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              Cadastrar afiliado com documento (IA)
            </h2>
            <button type="button" onClick={fecharDocFlow} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-white/60 mb-4">
            O afiliado te passou um documento (RG, CPF, etc.)? Anexe aqui. A IA lê os dados e você só confirma e informa <strong>e-mail e telefone</strong>. Conta bancária o afiliado completa depois no painel dele.
          </p>

          {docFlowStep === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processarDocumento(f);
                }}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => !docExtracting && fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && !docExtracting && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (docExtracting) return;
                  const f = e.dataTransfer.files?.[0];
                  if (f && (f.type === 'application/pdf' || f.type.startsWith('image/'))) processarDocumento(f);
                  else if (f) toast.error('Use PDF, JPG ou PNG.');
                }}
                className={`w-full py-10 rounded-xl border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 transition-colors flex flex-col items-center gap-2 text-white/80 ${docExtracting ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
              >
                {docExtracting ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
                    <span>Lendo documento com IA...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="h-10 w-10 text-[#D4AF37]" />
                    <span>Clique ou arraste o documento (PDF, JPG ou PNG)</span>
                    <span className="text-xs text-white/50">RG, CPF ou outro com nome e dados. Arraste o arquivo aqui se preferir.</span>
                  </>
                )}
              </div>
            </div>
          )}

          {docFlowStep === 'form' && (
            <form onSubmit={handleDocSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Nome *</label>
                  <input
                    type="text"
                    value={docNome}
                    onChange={(e) => setDocNome(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">CPF</label>
                  <input
                    type="text"
                    value={docCpf}
                    onChange={(e) => setDocCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="Somente números"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 outline-none"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">E-mail *</label>
                  <input
                    type="email"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="tel"
                    value={docTelefone}
                    onChange={(e) => setDocTelefone(e.target.value)}
                    placeholder="(21) 99999-9999"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 outline-none"
                    required
                  />
                </div>
              </div>
              {docUrl && <p className="text-xs text-white/50">Documento anexado e salvo.</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={docCriando}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#F6E05E] disabled:opacity-60"
                >
                  {docCriando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {docCriando ? 'Cadastrando...' : 'Cadastrar afiliado'}
                </button>
                <button type="button" onClick={() => setDocFlowStep('upload')} className="px-4 py-2.5 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 text-sm">
                  Trocar documento
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCriar} className="mb-8 p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Novo afiliado</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do indicador"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(21) 99999-9999"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={criando}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#F6E05E] disabled:opacity-60"
          >
            {criando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {criando ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
        </div>
      ) : afiliados.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <Link2 className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/70 mb-2">Nenhum afiliado cadastrado ainda.</p>
          <p className="text-white/50 text-sm mb-6">Cadastre pessoas que vão indicar leads para você; cada uma recebe um link exclusivo.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold"
          >
            <UserPlus className="h-5 w-5" /> Cadastrar primeiro afiliado
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {afiliados.map((a) => {
            const linkIndicar = `${BASE_URL}/indicar?ref=${a.token_unico}`;
            const linkEconomizar = `${BASE_URL}/economizar/afiliado/${a.token_unico}`;
            const isCopiedIndicar = copiadoId === a.token_unico;
            const isCopiedEconomizar = copiadoEconomizarId === a.token_unico;
            return (
              <li
                key={a.id}
                className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                  a.ativo ? 'bg-white/[0.03] border-white/10' : 'bg-white/[0.02] border-white/5 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{a.nome}</span>
                      {!a.ativo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">Inativo</span>
                      )}
                    </div>
                    {a.email && (
                      <p className="flex items-center gap-1.5 text-sm text-white/60 mt-1">
                        <Mail className="h-3.5 w-3.5" /> {a.email}
                      </p>
                    )}
                    {a.telefone && (
                      <p className="flex items-center gap-1.5 text-sm text-white/60 mt-0.5">
                        <Phone className="h-3.5 w-3.5" /> {a.telefone}
                      </p>
                    )}
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-white/50 w-28 shrink-0">Indicar cliente:</span>
                        <code className="text-xs px-2 py-1 rounded-lg bg-white/5 text-white/70 truncate max-w-[180px] sm:max-w-[240px]">
                          {linkIndicar}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyLinkIndicar(a.token_unico)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] text-sm font-medium transition-colors"
                        >
                          {isCopiedIndicar ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {isCopiedIndicar ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-white/50 w-28 shrink-0">Economizar (clientes):</span>
                        <code className="text-xs px-2 py-1 rounded-lg bg-white/5 text-white/70 truncate max-w-[180px] sm:max-w-[240px]">
                          {linkEconomizar}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyLinkEconomizar(a.token_unico)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] text-sm font-medium transition-colors"
                        >
                          {isCopiedEconomizar ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {isCopiedEconomizar ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(a)}
                      title={a.ativo ? 'Desativar' : 'Ativar'}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        a.ativo
                          ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {a.ativo ? <Power className="h-5 w-5" /> : <PowerOff className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-white/60">
        <p className="font-medium text-white/80 mb-1">Como funciona</p>
        <p>
          <strong className="text-white/80">Indicar cliente:</strong> envie esse link ao afiliado; ele abre e preenche só os dados da pessoa indicada (sem se cadastrar de novo). A indicação entra na sua lista de Indicações.
        </p>
        <p className="mt-2">
          <strong className="text-white/80">Economizar (para clientes):</strong> o afiliado envia esse link aos clientes. Quem acessar e usar a calculadora fica vinculado ao afiliado e a você.
        </p>
        <p className="mt-2 text-white/50">
          <strong className="text-white/70">Cadastro com documento (IA):</strong> o afiliado te envia um documento (RG, CPF etc.); você anexa aqui, a IA preenche nome e CPF, você informa e-mail e telefone e cadastra. O afiliado completa depois a conta bancária no painel dele.
        </p>
      </div>
    </div>
  );
}
