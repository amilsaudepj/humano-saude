'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Eye,
  X,
  Shield,
  AlertTriangle,
  Search,
  ScrollText,
  FileText,
  Globe,
  User,
  Copy,
  ExternalLink,
  Link2,
  FolderOpen,
  CreditCard,
  Download,
  Loader2,
  ChevronRight,
  Landmark,
  IdCard,
  Camera,
  FileCheck,
  RefreshCw,
  ImageIcon,
  Send,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSolicitacoes,
  aprovarSolicitacao,
  rejeitarSolicitacao,
  getTermosAceites,
  type SolicitacaoCorretor,
  type TermoAceite,
} from '@/app/actions/solicitacoes-corretor';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Clock },
  aprovado: { label: 'Aprovado', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle },
  rejeitado: { label: 'Rejeitado', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
};

// ─── Modal de Detalhes ─────────────────────────────────────
function DetalheModal({
  solicitacao,
  onClose,
  onAprovar,
  onRejeitar,
  onboardingLinks,
}: {
  solicitacao: SolicitacaoCorretor;
  onClose: () => void;
  onAprovar: (id: string) => void;
  onRejeitar: (id: string, motivo: string) => void;
  onboardingLinks: Record<string, string>;
}) {
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [showRejeicao, setShowRejeicao] = useState(false);
  const [copied, setCopied] = useState(false);

  const onboardingLink = onboardingLinks[solicitacao.id];

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0B1215] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">{solicitacao.nome_completo}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'text-xs font-bold px-2.5 py-0.5 rounded-full border',
                solicitacao.tipo_pessoa === 'pj'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20',
              )}>
                {solicitacao.tipo_pessoa === 'pj' ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}
              </span>
              <span className="text-sm text-white/40">
                {new Date(solicitacao.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dados */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/[0.03] rounded-xl p-3 min-w-0">
              <span className="text-xs text-white/40 uppercase block mb-1">E-mail</span>
              <p className="text-sm text-white flex items-center gap-2 min-w-0">
                <Mail className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span className="truncate">{solicitacao.email}</span>
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <span className="text-xs text-white/40 uppercase block mb-1">Telefone</span>
              <p className="text-sm text-white flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#D4AF37] shrink-0" />
                {solicitacao.telefone}
              </p>
            </div>
          </div>

          {/* Documento PF/PJ */}
          <div className="grid grid-cols-2 gap-3">
            {solicitacao.cpf && (
              <div className="bg-white/[0.03] rounded-xl p-3">
                <span className="text-xs text-white/40 uppercase block mb-1">CPF</span>
                <p className="text-sm text-white">{solicitacao.cpf}</p>
              </div>
            )}
            {solicitacao.cnpj && (
              <div className="bg-white/[0.03] rounded-xl p-3">
                <span className="text-xs text-white/40 uppercase block mb-1">CNPJ</span>
                <p className="text-sm text-white">{solicitacao.cnpj}</p>
              </div>
            )}
          </div>

          {/* PJ Fields */}
          {solicitacao.tipo_pessoa === 'pj' && (
            <div className="grid grid-cols-1 gap-3">
              {solicitacao.razao_social && (
                <div className="bg-white/[0.03] rounded-xl p-3">
                  <span className="text-xs text-white/40 uppercase block mb-1">Razão Social</span>
                  <p className="text-sm text-white flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#D4AF37]" />
                    {solicitacao.razao_social}
                  </p>
                </div>
              )}
              {solicitacao.nome_fantasia && (
                <div className="bg-white/[0.03] rounded-xl p-3">
                  <span className="text-xs text-white/40 uppercase block mb-1">Nome Fantasia</span>
                  <p className="text-sm text-white">{solicitacao.nome_fantasia}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {solicitacao.registro_susep && (
              <div className="bg-white/[0.03] rounded-xl p-3">
                <span className="text-xs text-white/40 uppercase block mb-1">SUSEP</span>
                <p className="text-sm text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#D4AF37]" />
                  {solicitacao.registro_susep}
                </p>
              </div>
            )}
            <div className="bg-white/[0.03] rounded-xl p-3">
              <span className="text-xs text-white/40 uppercase block mb-1">Experiência</span>
              <p className="text-sm text-white flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#D4AF37]" />
                {solicitacao.experiencia_anos} anos
              </p>
            </div>
          </div>

          {solicitacao.especialidade && (
            <div className="bg-white/[0.03] rounded-xl p-3">
              <span className="text-xs text-white/40 uppercase block mb-1">Especialidade</span>
              <p className="text-sm text-white capitalize">{solicitacao.especialidade.replace('_', ' ')}</p>
            </div>
          )}

          {solicitacao.operadoras_experiencia && solicitacao.operadoras_experiencia.length > 0 && (
            <div className="bg-white/[0.03] rounded-xl p-3">
              <span className="text-xs text-white/40 uppercase block mb-2">Operadoras</span>
              <div className="flex flex-wrap gap-1.5">
                {solicitacao.operadoras_experiencia.map((op) => (
                  <span key={op} className="px-2.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium">
                    {op}
                  </span>
                ))}
              </div>
            </div>
          )}

          {solicitacao.mensagem && (
            <div className="bg-white/[0.03] rounded-xl p-3">
              <span className="text-xs text-white/40 uppercase block mb-1">Mensagem</span>
              <p className="text-sm text-white/70 leading-relaxed">{solicitacao.mensagem}</p>
            </div>
          )}

          {/* Motivações */}
          {solicitacao.motivacoes && solicitacao.motivacoes.length > 0 && (
            <div className="bg-white/[0.03] rounded-xl p-3">
              <span className="text-xs text-white/40 uppercase block mb-2">Motivações</span>
              <div className="flex flex-wrap gap-1.5">
                {solicitacao.motivacoes.map((m) => (
                  <span key={m} className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium capitalize">
                    {m.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Modalidade de Trabalho */}
          {solicitacao.modalidade_trabalho && (
            <div className="bg-white/[0.03] rounded-xl p-3">
              <span className="text-xs text-white/40 uppercase block mb-1">Modalidade de Trabalho</span>
              <p className="text-sm text-white capitalize flex items-center gap-2">
                {solicitacao.modalidade_trabalho === 'presencial' && '🏢'}
                {solicitacao.modalidade_trabalho === 'digital' && '💻'}
                {solicitacao.modalidade_trabalho === 'hibrido' && '🔄'}
                {solicitacao.modalidade_trabalho}
              </p>
            </div>
          )}

          {/* Como nos conheceu */}
          {solicitacao.como_conheceu && (
            <div className="bg-white/[0.03] rounded-xl p-3">
              <span className="text-xs text-white/40 uppercase block mb-1">Como nos conheceu</span>
              <p className="text-sm text-white capitalize flex items-center gap-2">
                {solicitacao.como_conheceu === 'instagram' && '📸'}
                {solicitacao.como_conheceu === 'facebook' && '📘'}
                {solicitacao.como_conheceu === 'google' && '🔍'}
                {solicitacao.como_conheceu === 'indicacao_amigo' && '🤝'}
                {solicitacao.como_conheceu === 'linkedin' && '💼'}
                {solicitacao.como_conheceu === 'youtube' && '▶️'}
                {solicitacao.como_conheceu === 'evento' && '🎤'}
                {solicitacao.como_conheceu === 'outro' && '💬'}
                {solicitacao.como_conheceu.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          {/* Aceite de Termos */}
          <div className={cn(
            'rounded-xl p-3 border',
            solicitacao.termo_aceito
              ? 'bg-green-500/5 border-green-500/15'
              : 'bg-red-500/5 border-red-500/15',
          )}>
            <span className="text-xs text-white/40 uppercase block mb-1">Termos de Uso e LGPD</span>
            <div className="flex items-center gap-2">
              {solicitacao.termo_aceito ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">Aceito</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-sm text-red-400 font-medium">Não aceito</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        {solicitacao.status === 'pendente' && (
          <div className="mt-6 space-y-3">
            {!showRejeicao ? (
              <div className="flex gap-3">
                <button
                  onClick={() => onAprovar(solicitacao.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-all"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprovar Corretor
                </button>
                <button
                  onClick={() => setShowRejeicao(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeitar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  placeholder="Motivo da rejeição..."
                  rows={2}
                  className="w-full bg-white/5 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-red-500/40 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRejeicao(false)}
                    className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => onRejeitar(solicitacao.id, motivoRejeicao)}
                    className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all"
                  >
                    Confirmar Rejeição
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {solicitacao.status === 'aprovado' && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">Corretor aprovado e ativo no sistema</span>
            </div>

            {/* Link de Onboarding */}
            {onboardingLink && (
              <div className="rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[#D4AF37]" />
                  <span className="text-sm font-bold text-[#D4AF37] uppercase">Link de Onboarding</span>
                </div>
                <p className="text-xs text-white/40">
                  Envie este link para o corretor completar o cadastro (documentos + dados bancários). Válido por 7 dias.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white/60 truncate font-mono">
                    {onboardingLink}
                  </div>
                  <button
                    onClick={() => copyLink(onboardingLink)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      copied
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25',
                    )}
                  >
                    {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {solicitacao.status === 'rejeitado' && (
          <div className="mt-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400 font-medium">Solicitação rejeitada</span>
            </div>
            {solicitacao.motivo_rejeicao && (
              <p className="text-sm text-red-400/70 ml-6">{solicitacao.motivo_rejeicao}</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Página Principal ──────────────────────────────────────
export default function SolicitacoesCorretorPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'solicitacoes' | 'termos' | 'documentos' | 'alteracoes'>('solicitacoes');
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCorretor[]>([]);
  const [termosAceites, setTermosAceites] = useState<TermoAceite[]>([]);
  const [corretoresComDocs, setCorretoresComDocs] = useState<Array<{
    id: string;
    nome: string;
    cpf: string | null;
    email: string;
    telefone: string | null;
    susep: string | null;
    data_admissao: string | null;
    created_at: string | null;
    metadata: Record<string, unknown>;
    solicitacao: Record<string, unknown> | null;
    documentos: Array<{ id: string; tipo: string; nome_arquivo: string; url: string; mime_type?: string; tamanho_bytes?: number; status: string; created_at: string }>;
    dados_bancarios: Array<{ id: string; banco_codigo?: string; banco_nome: string; agencia: string; conta: string; tipo_conta: string; titular_nome?: string; titular_documento?: string; tipo_chave_pix?: string; chave_pix: string; ativo?: boolean; verificado?: boolean; created_at: string }>;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('pendente');
  const [busca, setBusca] = useState('');
  const [selected, setSelected] = useState<SolicitacaoCorretor | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<typeof corretoresComDocs[0] | null>(null);
  const [onboardingLinks, setOnboardingLinks] = useState<Record<string, string>>({});
  const [reenviando, setReenviando] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<{ url: string; nome: string; mime?: string } | null>(null);
  const [alteracoesBancarias, setAlteracoesBancarias] = useState<Array<{
    id: string;
    corretor_id: string;
    banco_nome: string;
    agencia: string;
    conta: string;
    tipo_conta: string;
    titular_nome: string;
    titular_documento: string;
    tipo_chave_pix: string | null;
    chave_pix: string | null;
    motivo: string;
    dados_antigos: Record<string, unknown> | null;
    status: string;
    motivo_rejeicao: string | null;
    created_at: string;
    aprovado_em: string | null;
    corretores: { nome: string; email: string; cpf: string | null } | null;
  }>>([]);
  const [processandoAlteracao, setProcessandoAlteracao] = useState<string | null>(null);
  const [motivoRejeicaoBank, setMotivoRejeicaoBank] = useState('');
  const [showRejeicaoBank, setShowRejeicaoBank] = useState<string | null>(null);

  // Feedback ao voltar do link de aprovação por e-mail (mesma lógica do design system)
  useEffect(() => {
    const aprovado = searchParams.get('aprovado');
    const erro = searchParams.get('erro');
    if (aprovado === '1') {
      toast.success('Cadastro aprovado com sucesso pelo link do e-mail. O corretor recebeu o acesso.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (erro) {
      const msg = erro === 'link-expirado' ? 'Link expirado ou inválido.' : erro === 'ja-processado' ? 'Solicitação já foi processada.' : 'Link inválido.';
      toast.error(msg);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  const fetchSolicitacoes = useCallback(async () => {
    setLoading(true);
    const result = await getSolicitacoes(filtro || undefined);
    if (result.success && result.data) {
      setSolicitacoes(result.data);
    }
    setLoading(false);
  }, [filtro]);

  const fetchTermos = useCallback(async () => {
    setLoading(true);
    const result = await getTermosAceites();
    if (result.success && result.data) {
      setTermosAceites(result.data);
    }
    setLoading(false);
  }, []);

  const fetchDocumentos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/corretores-docs');
      const data = await res.json();
      if (data.success) {
        setCorretoresComDocs(data.data);
      }
    } catch (err) {
      console.error('[fetchDocumentos]', err);
    }
    setLoading(false);
  }, []);

  const fetchAlteracoes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/corretor/alteracao-bancaria?status=pendente');
      const data = await res.json();
      if (data.success) {
        setAlteracoesBancarias(data.data || []);
      }
    } catch (err) {
      console.error('[fetchAlteracoes]', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'solicitacoes') {
      fetchSolicitacoes();
    } else if (tab === 'termos') {
      fetchTermos();
    } else if (tab === 'documentos') {
      fetchDocumentos();
    } else if (tab === 'alteracoes') {
      fetchAlteracoes();
    }
  }, [tab, fetchSolicitacoes, fetchTermos, fetchDocumentos, fetchAlteracoes]);

  // Load alteracoes count on mount for badge
  useEffect(() => {
    fetchAlteracoes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAprovar = async (id: string) => {
    // Find the solicitacao to get tipo_pessoa
    const sol = solicitacoes.find((s) => s.id === id);
    const result = await aprovarSolicitacao(id);
    if (result.success) {
      toast.success('Corretor aprovado com sucesso!');

      // Build onboarding link
      if (result.onboardingToken) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const tipo = sol?.tipo_pessoa || 'pf';
        const link = `${baseUrl}/dashboard/corretor/onboarding?token=${result.onboardingToken}&tipo=${tipo}`;
        setOnboardingLinks((prev) => ({ ...prev, [id]: link }));

        // Don't close modal — show the onboarding link
        if (selected?.id === id) {
          setSelected({ ...selected!, status: 'aprovado' as const });
        }
      } else {
        setSelected(null);
      }

      fetchSolicitacoes();
    } else {
      toast.error(result.error ?? 'Erro ao aprovar');
    }
  };

  const handleRejeitar = async (id: string, motivo: string) => {
    const result = await rejeitarSolicitacao(id, motivo);
    if (result.success) {
      toast.success('Solicitação rejeitada');
      setSelected(null);
      fetchSolicitacoes();
    } else {
      toast.error(result.error ?? 'Erro ao rejeitar');
    }
  };

  const handleReenviarNotificacao = async (corretorId: string) => {
    setReenviando(corretorId);
    try {
      const res = await fetch('/api/admin/reenviar-notificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corretor_id: corretorId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Notificação reenviada!');
        fetchDocumentos();
      } else {
        toast.error(data.error || 'Erro ao reenviar');
      }
    } catch {
      toast.error('Erro de conexão');
    }
    setReenviando(null);
  };

  const handleAprovarAlteracao = async (alteracaoId: string) => {
    setProcessandoAlteracao(alteracaoId);
    try {
      const res = await fetch('/api/admin/alteracao-bancaria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alteracao_id: alteracaoId, acao: 'aprovar' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Alteração bancária aprovada!');
        fetchAlteracoes();
      } else {
        toast.error(data.error || 'Erro ao aprovar');
      }
    } catch {
      toast.error('Erro de conexão');
    }
    setProcessandoAlteracao(null);
  };

  const handleRejeitarAlteracao = async (alteracaoId: string, motivo: string) => {
    if (!motivo.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    setProcessandoAlteracao(alteracaoId);
    try {
      const res = await fetch('/api/admin/alteracao-bancaria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alteracao_id: alteracaoId, acao: 'rejeitar', motivo_rejeicao: motivo }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Alteração bancária rejeitada');
        setShowRejeicaoBank(null);
        setMotivoRejeicaoBank('');
        fetchAlteracoes();
      } else {
        toast.error(data.error || 'Erro ao rejeitar');
      }
    } catch {
      toast.error('Erro de conexão');
    }
    setProcessandoAlteracao(null);
  };

  const pendentes = solicitacoes.filter((s) => s.status === 'pendente');
  const filtered = solicitacoes.filter((s) =>
    !busca || s.nome_completo.toLowerCase().includes(busca.toLowerCase()) || s.email.toLowerCase().includes(busca.toLowerCase()),
  );

  const filteredTermos = termosAceites.filter((t) =>
    !busca || t.nome_completo.toLowerCase().includes(busca.toLowerCase()) || t.email.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#D4AF37]" />
            Gestão de Corretores
          </h1>
          <p className="text-sm text-white/40 mt-1">Aprovação de novos corretores e controle de termos</p>
        </div>

        {pendentes.length > 0 && tab !== 'solicitacoes' && (
          <button
            onClick={() => { setTab('solicitacoes'); setFiltro('pendente'); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium animate-pulse"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.02] p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('solicitacoes')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'solicitacoes'
              ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
              : 'text-white/50 hover:text-white/70 border border-transparent',
          )}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Solicitações
          {pendentes.length > 0 && (
            <span className="ml-1 h-4 min-w-4 px-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center justify-center">
              {pendentes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('termos')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'termos'
              ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
              : 'text-white/50 hover:text-white/70 border border-transparent',
          )}
        >
          <ScrollText className="h-3.5 w-3.5" />
          Termos Aceitos
        </button>
        <button
          onClick={() => setTab('documentos')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'documentos'
              ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
              : 'text-white/50 hover:text-white/70 border border-transparent',
          )}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Documentos & Bancário
        </button>
        <button
          onClick={() => setTab('alteracoes')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'alteracoes'
              ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
              : 'text-white/50 hover:text-white/70 border border-transparent',
          )}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Alterações Bancárias
          {alteracoesBancarias.filter(a => a.status === 'pendente').length > 0 && (
            <span className="ml-1 h-4 min-w-4 px-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center justify-center">
              {alteracoesBancarias.filter(a => a.status === 'pendente').length}
            </span>
          )}
        </button>
      </div>

      {/* ─── Tab: Solicitações ──────────────────────────── */}
      {tab === 'solicitacoes' && (
        <>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1">
              {[
                { value: '', label: 'Todos' },
                { value: 'pendente', label: '⏳ Pendentes' },
                { value: 'aprovado', label: '✅ Aprovados' },
                { value: 'rejeitado', label: '❌ Rejeitados' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFiltro(f.value)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    filtro === f.value
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                      : 'bg-white/5 text-white/50 hover:text-white/70 border border-transparent',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37]/30"
              />
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-white/20">
              <UserPlus className="h-10 w-10 mb-3" />
              <p className="text-sm">Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((s, index) => {
                const config = STATUS_CONFIG[s.status];
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm cursor-pointer hover:border-white/15 transition-all',
                      s.status === 'pendente'
                        ? 'bg-yellow-500/[0.03] border-yellow-500/10'
                        : 'bg-white/[0.03] border-white/[0.08]',
                    )}
                    onClick={() => setSelected(s)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', config.bg)}>
                        <StatusIcon className={cn('h-5 w-5', config.color)} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{s.nome_completo}</p>
                          <span className={cn(
                            'text-[11px] font-bold px-1.5 py-0.5 rounded',
                            s.tipo_pessoa === 'pj'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-purple-500/10 text-purple-400',
                          )}>
                            {s.tipo_pessoa === 'pj' ? 'PJ' : 'PF'}
                          </span>
                          {s.termo_aceito && (
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                              TERMOS ✓
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-white/40 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {s.email}
                          </span>
                          <span className="text-sm text-white/30">
                            {new Date(s.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', config.bg, config.color, config.border, 'border')}>
                        {config.label.toUpperCase()}
                      </span>

                      {s.status === 'pendente' && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAprovar(s.id); }}
                            className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-all"
                            title="Aprovar"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(s); }}
                            className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Tab: Termos Aceitos ────────────────────────── */}
      {tab === 'termos' && (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37]/30"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <p className="text-xs text-white/30 uppercase mb-1">Total de Aceites</p>
              <p className="text-2xl font-bold text-white">{termosAceites.length}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <p className="text-xs text-white/30 uppercase mb-1">Termos de Uso</p>
              <p className="text-2xl font-bold text-[#D4AF37]">
                {termosAceites.filter((t) => t.termo_tipo === 'termos_uso').length}
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <p className="text-xs text-white/30 uppercase mb-1">LGPD</p>
              <p className="text-2xl font-bold text-green-400">
                {termosAceites.filter((t) => t.termo_tipo === 'lgpd').length}
              </p>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse" />
              ))}
            </div>
          ) : filteredTermos.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-white/20">
              <ScrollText className="h-10 w-10 mb-3" />
              <p className="text-sm">Nenhum aceite de termos encontrado</p>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/[0.06] text-xs text-white/30 uppercase font-bold">
                <div className="col-span-3">Nome</div>
                <div className="col-span-2">E-mail</div>
                <div className="col-span-1">Doc</div>
                <div className="col-span-2">Tipo Termo</div>
                <div className="col-span-2">Data/Hora</div>
                <div className="col-span-2">IP</div>
              </div>

              {/* Rows */}
              {filteredTermos.map((t, index) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="col-span-3">
                    <p className="text-sm text-white font-medium truncate flex items-center gap-1.5">
                      <User className="h-3 w-3 text-[#D4AF37] shrink-0" />
                      {t.nome_completo}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-white/50 truncate">{t.email}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-white/40 truncate">{t.documento}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-full',
                      t.termo_tipo === 'termos_uso'
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                        : t.termo_tipo === 'lgpd'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-blue-500/10 text-blue-400',
                    )}>
                      {t.termo_tipo === 'termos_uso' ? 'TERMOS USO' :
                        t.termo_tipo === 'lgpd' ? 'LGPD' :
                          t.termo_tipo.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-white/20 ml-1">v{t.termo_versao}</span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-white/50">
                      {new Date(t.aceite_timestamp).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-white/25">
                      {new Date(t.aceite_timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-white/40 truncate flex items-center gap-1">
                      <Globe className="h-3 w-3 shrink-0" />
                      {t.ip_address || '—'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Tab: Documentos & Bancário ────────────────── */}
      {tab === 'documentos' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <p className="text-xs text-white/30 uppercase mb-1">Total Corretores</p>
              <p className="text-2xl font-bold text-white">{corretoresComDocs.filter(c => c.id !== 'orfaos').length}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <p className="text-xs text-white/30 uppercase mb-1">Com Documentos</p>
              <p className="text-2xl font-bold text-[#D4AF37]">{corretoresComDocs.filter(c => c.documentos.length > 0).length}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <p className="text-xs text-white/30 uppercase mb-1">Com Banco</p>
              <p className="text-2xl font-bold text-green-400">{corretoresComDocs.filter(c => c.dados_bancarios.length > 0).length}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <p className="text-xs text-white/30 uppercase mb-1">Onboarding Completo</p>
              <p className="text-2xl font-bold text-blue-400">{corretoresComDocs.filter(c => Boolean(c.metadata?.onboarding_completo)).length}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-[#D4AF37] animate-spin" />
            </div>
          ) : corretoresComDocs.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-white/20">
              <FolderOpen className="h-10 w-10 mb-3" />
              <p className="text-sm">Nenhum corretor completou o onboarding ainda</p>
              <p className="text-sm text-white/15 mt-1">Quando um corretor enviar documentos ou dados bancários, aparecerá aqui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {corretoresComDocs.map((corretor, index) => {
                const meta = corretor.metadata || {};
                const etapa = String(meta.onboarding_etapa || 'pendente');
                const completo = Boolean(meta.onboarding_completo);
                const hasDocs = corretor.documentos.length > 0;
                const hasBank = corretor.dados_bancarios.length > 0;

                return (
                  <motion.div
                    key={corretor.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => setSelectedDoc(corretor)}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-2xl border cursor-pointer hover:border-white/15 transition-all group',
                      corretor.id === 'orfaos'
                        ? 'bg-red-500/[0.03] border-red-500/10'
                        : completo
                          ? 'bg-green-500/[0.02] border-green-500/10'
                          : 'bg-white/[0.03] border-white/[0.08]',
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center',
                        corretor.id === 'orfaos'
                          ? 'bg-red-500/10'
                          : completo
                            ? 'bg-green-500/10'
                            : 'bg-[#D4AF37]/10',
                      )}>
                        {corretor.id === 'orfaos' ? (
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        ) : (
                          <User className="h-5 w-5 text-[#D4AF37]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{corretor.nome}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-sm text-white/40">{corretor.email}</span>
                          {corretor.telefone && (
                            <span className="text-sm text-white/30 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {corretor.telefone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status badges */}
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          'text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1',
                          hasDocs ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-white/5 text-white/20',
                        )}>
                          <FileText className="h-2.5 w-2.5" />
                          {hasDocs ? `${corretor.documentos.length} DOC${corretor.documentos.length > 1 ? 'S' : ''}` : 'SEM DOC'}
                        </span>
                        <span className={cn(
                          'text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1',
                          hasBank ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/20',
                        )}>
                          <Landmark className="h-2.5 w-2.5" />
                          {hasBank ? 'BANCO ✓' : 'SEM BANCO'}
                        </span>
                      </div>

                      {/* Onboarding status */}
                      {corretor.id !== 'orfaos' && (
                        <span className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded-full border',
                          completo
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : etapa === 'bancario'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : etapa === 'documentos'
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                : 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                        )}>
                          {completo ? 'COMPLETO ✓' : etapa === 'bancario' ? 'FALTA DOC' : etapa === 'documentos' ? 'FALTA BANCO' : 'PENDENTE'}
                        </span>
                      )}

                      <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Tab: Alterações Bancárias ─────────────────── */}
      {tab === 'alteracoes' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-[#D4AF37] animate-spin" />
            </div>
          ) : alteracoesBancarias.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-white/20">
              <ArrowRightLeft className="h-10 w-10 mb-3" />
              <p className="text-sm">Nenhuma solicitação de alteração bancária pendente</p>
              <p className="text-sm text-white/15 mt-1">Quando um corretor solicitar troca de dados bancários, aparecerá aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alteracoesBancarias.map((alt) => {
                const dadosAntigos = alt.dados_antigos as Record<string, unknown> | null;
                return (
                  <div key={alt.id} className={cn(
                    'bg-white/[0.03] border rounded-2xl p-5',
                    alt.status === 'pendente' ? 'border-yellow-500/15' : alt.status === 'aprovado' ? 'border-green-500/15' : 'border-red-500/15',
                  )}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-[#D4AF37]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{alt.corretores?.nome || '—'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-white/40">{alt.corretores?.email || '—'}</span>
                            {alt.corretores?.cpf && (
                              <span className="text-xs text-white/25">CPF: {alt.corretores.cpf}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded-full border',
                          alt.status === 'pendente' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            : alt.status === 'aprovado' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20',
                        )}>
                          {alt.status === 'pendente' ? '⏳ PENDENTE' : alt.status === 'aprovado' ? '✓ APROVADA' : '✕ REJEITADA'}
                        </span>
                        <span className="text-xs text-white/20">
                          {new Date(alt.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Motivo */}
                    <div className="bg-white/[0.02] rounded-xl p-3 mb-4">
                      <span className="text-[11px] text-white/25 uppercase block mb-1">Motivo da Alteração</span>
                      <p className="text-sm text-white/70">{alt.motivo}</p>
                    </div>

                    {/* Dados antigos vs novos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {/* Dados Antigos */}
                      {dadosAntigos && (
                        <div className="bg-red-500/[0.03] border border-red-500/10 rounded-xl p-3">
                          <p className="text-[11px] text-red-400 uppercase font-bold mb-2">Conta Atual</p>
                          <div className="space-y-1">
                            <p className="text-sm text-white/50">{String(dadosAntigos.banco_nome || '—')}</p>
                            <p className="text-xs text-white/30">Ag. {String(dadosAntigos.agencia || '—')} • Cc. {String(dadosAntigos.conta || '—')}</p>
                            {dadosAntigos.titular_nome ? <p className="text-xs text-white/30">Titular: {String(dadosAntigos.titular_nome)}</p> : null}
                            {dadosAntigos.chave_pix ? <p className="text-xs text-white/30 font-mono">PIX: {String(dadosAntigos.chave_pix)}</p> : null}
                          </div>
                        </div>
                      )}
                      {/* Dados Novos */}
                      <div className="bg-green-500/[0.03] border border-green-500/10 rounded-xl p-3">
                        <p className="text-[11px] text-green-400 uppercase font-bold mb-2">Nova Conta Solicitada</p>
                        <div className="space-y-1">
                          <p className="text-sm text-white/50">{alt.banco_nome}</p>
                          <p className="text-xs text-white/30">Ag. {alt.agencia} • Cc. {alt.conta} ({alt.tipo_conta})</p>
                          {alt.titular_nome && <p className="text-xs text-white/30">Titular: {alt.titular_nome}</p>}
                          {alt.titular_documento && <p className="text-xs text-white/30">Doc: {alt.titular_documento}</p>}
                          {alt.chave_pix && <p className="text-xs text-white/30 font-mono">PIX ({alt.tipo_chave_pix}): {alt.chave_pix}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Ações (apenas se pendente) */}
                    {alt.status === 'pendente' && (
                      <>
                        {showRejeicaoBank === alt.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={motivoRejeicaoBank}
                              onChange={(e) => setMotivoRejeicaoBank(e.target.value)}
                              placeholder="Motivo da rejeição..."
                              rows={2}
                              className="w-full bg-white/5 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-red-500/40 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setShowRejeicaoBank(null); setMotivoRejeicaoBank(''); }}
                                className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm hover:text-white transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleRejeitarAlteracao(alt.id, motivoRejeicaoBank)}
                                disabled={processandoAlteracao === alt.id}
                                className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all disabled:opacity-50"
                              >
                                {processandoAlteracao === alt.id ? 'Rejeitando...' : 'Confirmar Rejeição'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleAprovarAlteracao(alt.id)}
                              disabled={processandoAlteracao === alt.id}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-all disabled:opacity-50"
                            >
                              {processandoAlteracao === alt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                              Aprovar Alteração
                            </button>
                            <button
                              onClick={() => setShowRejeicaoBank(alt.id)}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
                            >
                              <XCircle className="h-4 w-4" />
                              Rejeitar
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Resultado */}
                    {alt.status === 'rejeitado' && alt.motivo_rejeicao && (
                      <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3">
                        <span className="text-[11px] text-red-400 uppercase font-bold block mb-1">Motivo da Rejeição</span>
                        <p className="text-sm text-red-400/70">{alt.motivo_rejeicao}</p>
                      </div>
                    )}
                    {alt.status === 'aprovado' && alt.aprovado_em && (
                      <div className="rounded-xl bg-green-500/5 border border-green-500/10 p-3">
                        <p className="text-sm text-green-400">Aprovada em {new Date(alt.aprovado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Modal de Detalhes do Corretor (Documentos) ── */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B1215] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedDoc.nome}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-sm text-white/40 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedDoc.email}
                      </span>
                      {selectedDoc.telefone && (
                        <span className="text-sm text-white/30 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedDoc.telefone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="text-white/30 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-5">
                {(() => {
                  const meta = selectedDoc.metadata || {};
                  const isCompleto = Boolean(meta.onboarding_completo);
                  const onboardingEtapa = String(meta.onboarding_etapa || 'documentos');
                  const onboardingToken = meta.onboarding_token ? String(meta.onboarding_token) : null;
                  const tokenExpira = meta.onboarding_token_expira ? String(meta.onboarding_token_expira) : null;
                  const tipoPessoa = selectedDoc.solicitacao?.tipo_pessoa ? String(selectedDoc.solicitacao.tipo_pessoa) : null;
                  const especialidade = selectedDoc.solicitacao?.especialidade ? String(selectedDoc.solicitacao.especialidade) : null;
                  const modalidade = selectedDoc.solicitacao?.modalidade_trabalho ? String(selectedDoc.solicitacao.modalidade_trabalho) : null;
                  const operadoras = Array.isArray(selectedDoc.solicitacao?.operadoras_experiencia) ? (selectedDoc.solicitacao!.operadoras_experiencia as string[]) : [];

                  return (
                    <>
                {/* Info grid */}
                {selectedDoc.id !== 'orfaos' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedDoc.cpf && (
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <span className="text-[11px] text-white/25 uppercase block mb-0.5">CPF</span>
                        <p className="text-sm text-white font-medium">{selectedDoc.cpf}</p>
                      </div>
                    )}
                    {selectedDoc.susep && (
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <span className="text-[11px] text-white/25 uppercase block mb-0.5">SUSEP</span>
                        <p className="text-sm text-white font-medium flex items-center gap-1">
                          <Shield className="h-3 w-3 text-[#D4AF37]" />
                          {selectedDoc.susep}
                        </p>
                      </div>
                    )}
                    {selectedDoc.created_at && (
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <span className="text-[11px] text-white/25 uppercase block mb-0.5">Cadastro</span>
                        <p className="text-sm text-white">{new Date(selectedDoc.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    {tipoPessoa ? (
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <span className="text-[11px] text-white/25 uppercase block mb-0.5">Tipo</span>
                        <span className={cn(
                          'text-xs font-bold px-1.5 py-0.5 rounded',
                          tipoPessoa === 'pj'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-purple-500/10 text-purple-400',
                        )}>
                          {tipoPessoa === 'pj' ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}
                        </span>
                      </div>
                    ) : null}
                    {especialidade ? (
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <span className="text-[11px] text-white/25 uppercase block mb-0.5">Especialidade</span>
                        <p className="text-sm text-white capitalize">{especialidade.replace(/_/g, ' ')}</p>
                      </div>
                    ) : null}
                    {modalidade ? (
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <span className="text-[11px] text-white/25 uppercase block mb-0.5">Modalidade</span>
                        <p className="text-sm text-white capitalize flex items-center gap-1">
                          {modalidade === 'presencial' && '🏢'}
                          {modalidade === 'digital' && '💻'}
                          {modalidade === 'hibrido' && '🔄'}
                          {modalidade}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Onboarding Status */}
                {selectedDoc.id !== 'orfaos' && (
                  <div className={cn(
                    'rounded-xl p-4 border',
                    isCompleto
                      ? 'bg-green-500/5 border-green-500/15'
                      : 'bg-yellow-500/5 border-yellow-500/15',
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isCompleto ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-400" />
                        )}
                        <span className={cn(
                          'text-sm font-medium',
                          isCompleto ? 'text-green-400' : 'text-yellow-400',
                        )}>
                        {isCompleto
                            ? 'Onboarding Completo'
                            : `Onboarding em Progresso — Etapa: ${onboardingEtapa}`}
                        </span>
                      </div>
                      {onboardingToken ? (
                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/dashboard/corretor/onboarding?token=${onboardingToken}&tipo=${tipoPessoa || 'pf'}`;
                            navigator.clipboard.writeText(link);
                            toast.success('Link de onboarding copiado!');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/20 transition-all"
                        >
                          <Copy className="h-3 w-3" />
                          Copiar Link
                        </button>
                      ) : null}
                    </div>
                    {tokenExpira ? (
                      <p className="text-xs text-white/25 mt-2">
                        Token expira: {new Date(tokenExpira).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    ) : null}

                    {/* Botão Reenviar Notificação */}
                    {!isCompleto && selectedDoc.id !== 'orfaos' && (
                      <button
                        onClick={() => handleReenviarNotificacao(selectedDoc.id)}
                        disabled={reenviando === selectedDoc.id}
                        className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/20 transition-all disabled:opacity-50"
                      >
                        {reenviando === selectedDoc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        {reenviando === selectedDoc.id ? 'Reenviando...' : 'Reenviar Notificação de Onboarding'}
                      </button>
                    )}
                  </div>
                )}

                {/* Documentos Section */}
                <div>
                  <p className="text-sm text-white/50 uppercase font-bold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#D4AF37]" />
                    Documentos Enviados
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                      {selectedDoc.documentos.length}
                    </span>
                  </p>

                  {selectedDoc.documentos.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-white/15 bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]">
                      <FileText className="h-8 w-8 mb-2" />
                      <p className="text-sm">Nenhum documento enviado</p>
                      <p className="text-xs text-white/10 mt-0.5">O corretor precisa completar a etapa de documentos no onboarding</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedDoc.documentos.map((doc) => {
                        const docIcon = doc.tipo === 'cnh' ? IdCard
                          : doc.tipo === 'selfie' ? Camera
                          : doc.tipo.includes('rg') ? IdCard
                          : doc.tipo === 'contrato_social' ? FileCheck
                          : doc.tipo === 'cartao_cnpj' ? CreditCard
                          : FileText;
                        const DocIcon = docIcon;

                        return (
                          <div key={doc.id} className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3 border border-white/[0.05] hover:border-white/10 transition-all">
                            <div className={cn(
                              'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                              doc.status === 'aprovado' ? 'bg-green-500/10' : doc.status === 'rejeitado' ? 'bg-red-500/10' : doc.url ? 'bg-green-500/10' : 'bg-[#D4AF37]/10',
                            )}>
                              <DocIcon className={cn(
                                'h-4 w-4',
                                doc.status === 'aprovado' ? 'text-green-400' : doc.status === 'rejeitado' ? 'text-red-400' : doc.url ? 'text-green-400' : 'text-[#D4AF37]',
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium capitalize">{doc.tipo.replace(/_/g, ' ')}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-white/30 truncate">{doc.nome_arquivo}</p>
                                {doc.tamanho_bytes && (
                                  <span className="text-[11px] text-white/20 shrink-0">
                                    {(doc.tamanho_bytes / 1024).toFixed(0)}KB
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <span className={cn(
                                  'text-[11px] font-bold px-1.5 py-0.5 rounded',
                                  doc.status === 'aprovado' ? 'bg-green-500/10 text-green-400'
                                    : doc.status === 'rejeitado' ? 'bg-red-500/10 text-red-400'
                                    : doc.url ? 'bg-green-500/10 text-green-400'
                                    : 'bg-yellow-500/10 text-yellow-400',
                                )}>
                                  {doc.status === 'aprovado' ? '✓ APROVADO' : doc.status === 'rejeitado' ? '✕ REJEITADO' : doc.url ? '✓ ENVIADO' : '⏳ PENDENTE'}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              {doc.url && (
                                <button
                                  onClick={() => setDocPreview({ url: doc.url, nome: doc.nome_arquivo, mime: doc.mime_type })}
                                  className="h-7 w-7 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all"
                                  title="Visualizar / Baixar"
                                >
                                  {doc.mime_type?.startsWith('image/') ? (
                                    <ImageIcon className="h-3.5 w-3.5" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Dados Bancários Section */}
                <div>
                  <p className="text-sm text-white/50 uppercase font-bold mb-3 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-green-400" />
                    Dados Bancários
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                      {selectedDoc.dados_bancarios.length}
                    </span>
                  </p>

                  {selectedDoc.dados_bancarios.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-white/15 bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]">
                      <Landmark className="h-8 w-8 mb-2" />
                      <p className="text-sm">Nenhum dado bancário enviado</p>
                      <p className="text-xs text-white/10 mt-0.5">O corretor precisa completar a etapa bancária no onboarding</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDoc.dados_bancarios.map((db) => (
                        <div key={db.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Landmark className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-white font-medium">{db.banco_nome}</span>
                              {db.banco_codigo && (
                                <span className="text-xs text-white/25">Cód. {db.banco_codigo}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {db.verificado ? (
                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">VERIFICADO ✓</span>
                              ) : (
                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">PENDENTE</span>
                              )}
                              {db.ativo ? (
                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">ATIVO</span>
                              ) : (
                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">INATIVO</span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <span className="text-[11px] text-white/25 uppercase block mb-0.5">Agência</span>
                              <p className="text-sm text-white font-medium">{db.agencia}</p>
                            </div>
                            <div>
                              <span className="text-[11px] text-white/25 uppercase block mb-0.5">Conta ({db.tipo_conta})</span>
                              <p className="text-sm text-white font-medium">{db.conta}</p>
                            </div>
                            {db.titular_nome && (
                              <div>
                                <span className="text-[11px] text-white/25 uppercase block mb-0.5">Titular</span>
                                <p className="text-sm text-white capitalize">{db.titular_nome}</p>
                              </div>
                            )}
                            {db.titular_documento && (
                              <div>
                                <span className="text-[11px] text-white/25 uppercase block mb-0.5">CPF/CNPJ Titular</span>
                                <p className="text-sm text-white font-mono">{db.titular_documento}</p>
                              </div>
                            )}
                          </div>
                          {(db.chave_pix || db.tipo_chave_pix) && (
                            <div className="mt-3 pt-3 border-t border-white/[0.04]">
                              <div className="grid grid-cols-2 gap-3">
                                {db.tipo_chave_pix && (
                                  <div>
                                    <span className="text-[11px] text-white/25 uppercase block mb-0.5">Tipo Chave PIX</span>
                                    <p className="text-sm text-white capitalize">{db.tipo_chave_pix}</p>
                                  </div>
                                )}
                                {db.chave_pix && (
                                  <div>
                                    <span className="text-[11px] text-white/25 uppercase block mb-0.5">Chave PIX</span>
                                    <p className="text-sm text-white font-mono">{db.chave_pix}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <p className="text-[11px] text-white/15 mt-3">
                            Cadastrado em {new Date(db.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Operadoras */}
                {operadoras.length > 0 && (
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <span className="text-[11px] text-white/25 uppercase block mb-2">Operadoras com Experiência</span>
                    <div className="flex flex-wrap gap-1">
                      {operadoras.map((op: string) => (
                        <span key={op} className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium">
                          {op}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                    </>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/[0.06] flex items-center justify-between">
                <p className="text-xs text-white/20">
                  ID: {selectedDoc.id.substring(0, 8)}...
                </p>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/50 text-sm font-medium hover:text-white hover:bg-white/10 transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {selected && (
          <DetalheModal
            solicitacao={selected}
            onClose={() => setSelected(null)}
            onAprovar={handleAprovar}
            onRejeitar={handleRejeitar}
            onboardingLinks={onboardingLinks}
          />
        )}
      </AnimatePresence>

      {/* Modal de Preview de Documento */}
      <AnimatePresence>
        {docPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setDocPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <p className="text-sm text-white font-medium truncate">{docPreview.nome}</p>
                <div className="flex items-center gap-2">
                  <a
                    href={docPreview.url}
                    download={docPreview.nome}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold hover:bg-[#D4AF37]/20 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Baixar
                  </a>
                  <a
                    href={docPreview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs font-semibold hover:bg-white/10 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir
                  </a>
                  <button
                    onClick={() => setDocPreview(null)}
                    className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
                {docPreview.mime?.startsWith('image/') ? (
                  <img
                    src={docPreview.url}
                    alt={docPreview.nome}
                    className="max-w-full max-h-[70vh] rounded-lg object-contain"
                  />
                ) : docPreview.mime === 'application/pdf' ? (
                  <iframe
                    src={docPreview.url}
                    className="w-full h-[70vh] rounded-lg border border-white/10"
                    title={docPreview.nome}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-white/30">
                    <FileText className="h-12 w-12" />
                    <p className="text-sm">Preview não disponível para este tipo de arquivo</p>
                    <a
                      href={docPreview.url}
                      download={docPreview.nome}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-white text-sm font-semibold hover:bg-[#F6E05E] transition-all"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Arquivo
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
