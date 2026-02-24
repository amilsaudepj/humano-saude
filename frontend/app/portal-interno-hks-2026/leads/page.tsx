'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Phone, Mail, ArrowUpRight, CheckCircle, XCircle, Pause, MessageSquare, Calculator, ScanLine, PenLine, Globe, UserCheck, MailPlus, LayoutGrid, UserPlus } from 'lucide-react';
import { getLeads, updateLeadStatus } from '@/app/actions/leads';
import { getCorretoresMap } from '@/app/actions/indicacoes-admin';
import { getCardByLeadId } from '@/app/actions/crm-card-detail';
import type { LeadStatus } from '@/lib/types/database';
import { LEAD_STATUS } from '@/lib/types/database';
import {
  PageHeader,
  StatsCard,
  StatsGrid,
  StatusBadge,
  SearchInput,
  FilterSelect,
  DataTable,
  PageLoading,
} from '../components';
import type { Column } from '../components';
import { LeadDialog } from '../components/LeadDialog';
import { LeadDetailDrawer } from '../components/LeadDetailDrawer';
import { toast } from 'sonner';

// ============================================
// CONFIGURAÇÃO DE STATUS
// ============================================

const statusConfig: Record<LeadStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
  novo: { label: 'Novo', color: 'bg-blue-500/20 text-blue-400', icon: ArrowUpRight },
  contatado: { label: 'Contatado', color: 'bg-yellow-500/20 text-yellow-400', icon: Phone },
  negociacao: { label: 'Negociação', color: 'bg-purple-500/20 text-purple-400', icon: MessageSquare },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-orange-500/20 text-orange-400', icon: Mail },
  ganho: { label: 'Ganho', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  perdido: { label: 'Perdido', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  pausado: { label: 'Pausado', color: 'bg-gray-500/20 text-gray-400', icon: Pause },
};

// ============================================
// CONFIGURAÇÃO DE ORIGEM
// ============================================

const ORIGEM_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  calculadora_economia: { label: 'Calculadora Economia', color: 'bg-emerald-500/20 text-emerald-400', icon: Calculator },
  calculadora: { label: 'Simule seu plano', color: 'bg-emerald-600/20 text-emerald-300', icon: LayoutGrid },
  email_form: { label: 'Completar cotação', color: 'bg-violet-500/20 text-violet-400', icon: MailPlus },
  scanner_pdf: { label: 'Scanner Inteligente', color: 'bg-cyan-500/20 text-cyan-400', icon: ScanLine },
  manual: { label: 'Manual', color: 'bg-amber-500/20 text-amber-400', icon: PenLine },
  site: { label: 'Site', color: 'bg-indigo-500/20 text-indigo-400', icon: Globe },
  landing: { label: 'Landing', color: 'bg-slate-500/20 text-slate-400', icon: Globe },
  hero_form: { label: 'Formulário hero', color: 'bg-blue-500/20 text-blue-400', icon: Globe },
  landing_indicar_admin: { label: 'Indicação (sem vínculo)', color: 'bg-orange-500/20 text-orange-400', icon: UserCheck },
  landing_seja_afiliado: { label: 'Quero ser afiliado', color: 'bg-cyan-500/20 text-cyan-400', icon: UserPlus },
};

const ORIGEM_FALLBACK = { label: 'Direto', color: 'bg-gray-500/20 text-gray-400', icon: Globe };

/** Extrai o slug do corretor de dados_pdf */
function getCorretorSlug(lead: any): string | null {
  return lead?.dados_pdf?.corretor?.slug || null;
}

/** Extrai o ID do corretor de dados_pdf */
function getCorretorId(lead: any): string | null {
  return lead?.dados_pdf?.corretor?.id || null;
}

/** Retorna o nome do usuário (corretor) dono do lead: prioridade corretor_id (insurance_leads), depois dados_pdf */
function getCorretorNome(lead: any, corretorMap: Record<string, string>): string | null {
  if (lead?.corretor_id && corretorMap[lead.corretor_id]) return corretorMap[lead.corretor_id];
  const slug = getCorretorSlug(lead);
  const id = getCorretorId(lead);
  if (slug && corretorMap[slug]) return corretorMap[slug];
  if (id && corretorMap[id]) return corretorMap[id];
  if (lead?.corretor_id) return corretorMap[lead.corretor_id] ?? null;
  return slug ?? null;
}

// ============================================
// COLUNAS DA TABELA
// ============================================

function makeColumns(
  onStatusChange: (id: string, status: string) => void,
  corretorMap: Record<string, string>,
): Column<any>[] {
  return [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (lead) => (
        <div>
          <p className="font-medium text-white">{lead.nome}</p>
          {lead.email && <p className="text-xs text-gray-500">{lead.email}</p>}
        </div>
      ),
    },
    {
      key: 'usuario',
      header: 'Usuário',
      sortable: false,
      render: (lead) => {
        const nome = getCorretorNome(lead, corretorMap);
        return (
          <span className="text-[#D4AF37] font-medium">
            {nome || '—'}
          </span>
        );
      },
    },
    {
      key: 'empresa',
      header: 'Empresa',
      hidden: 'lg',
      sortable: true,
      render: (lead) => <span className="text-gray-400">{lead.empresa || '—'}</span>,
    },
    {
      key: 'whatsapp',
      header: 'WhatsApp',
      render: (lead) =>
        lead.whatsapp ? (
          <a
            href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300"
          >
            {lead.whatsapp}
          </a>
        ) : (
          <span className="text-gray-500">—</span>
        ),
    },
    {
      key: 'operadora_atual',
      header: 'Operadora Atual',
      hidden: 'md',
      sortable: true,
      render: (lead) => <span className="text-gray-400">{lead.operadora_atual || '—'}</span>,
    },
    {
      key: 'valor_atual',
      header: 'Valor Atual',
      hidden: 'lg',
      sortable: true,
      render: (lead) => (
        <span className="text-gray-400">
          {lead.valor_atual ? `R$ ${Number(lead.valor_atual).toLocaleString('pt-BR')}` : '—'}
        </span>
      ),
    },
    {
      key: 'origem',
      header: 'Origem',
      hidden: 'md',
      render: (lead) => {
        const origemKey = lead.origem || 'direto';
        const cfg = ORIGEM_CONFIG[origemKey] || ORIGEM_FALLBACK;
        const corretorNome = getCorretorNome(lead, corretorMap);
        return (
          <div className="flex flex-col gap-1">
            <StatusBadge label={cfg.label} color={cfg.color} icon={cfg.icon} />
            {corretorNome && (
              <span className="flex items-center gap-1 text-[10px] text-[#D4AF37]">
                <UserCheck className="h-3 w-3" />
                {corretorNome}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (lead) => {
        const cfg = statusConfig[lead.status as LeadStatus] || statusConfig.novo;
        return <StatusBadge label={cfg.label} color={cfg.color} icon={cfg.icon} />;
      },
    },
    {
      key: 'created_at',
      header: 'Data',
      hidden: 'lg',
      sortable: true,
      render: (lead) => (
        <span className="text-gray-500">
          {lead.created_at
            ? `${new Date(lead.created_at).toLocaleDateString('pt-BR')} ${new Date(lead.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ação',
      width: '120px',
      render: (lead) => (
        <select
          value={lead.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(lead.id, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border border-white/10 bg-transparent px-2 py-1 text-xs text-gray-300 focus:border-[#D4AF37]/50 focus:outline-none"
        >
          {LEAD_STATUS.map((s) => (
            <option key={s} value={s} className="bg-[#0a0a0a]">
              {statusConfig[s].label}
            </option>
          ))}
        </select>
      ),
    },
  ];
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrigem, setFilterOrigem] = useState('');
  const [filterCorretor, setFilterCorretor] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [corretorMap, setCorretorMap] = useState<Record<string, string>>({});

  async function loadCorretorMap() {
    const map = await getCorretoresMap();
    setCorretorMap(map);
  }

  async function loadLeads() {
    setLoading(true);
    const result = await getLeads({
      status: filterStatus || undefined,
      limit: 500,
      excludeOrigem: ['landing_seja_afiliado'],
    });
    if (result.success) setLeads(result.data);
    setLoading(false);
  }

  useEffect(() => { loadLeads(); }, [filterStatus]);
  useEffect(() => { loadCorretorMap(); }, []);

  async function handleStatusChange(leadId: string, newStatus: string) {
    const result = await updateLeadStatus(leadId, newStatus);
    if (result.success) {
      toast.success('Status atualizado');
      loadLeads();
    } else {
      toast.error('Erro ao atualizar status');
    }
  }

  const columns = useMemo(() => makeColumns(handleStatusChange, corretorMap), [corretorMap]);

  const filtered = useMemo(() => {
    let result = leads;

    // "Quero ser afiliado" nunca aparece em Leads — só em Afiliados
    result = result.filter((l) => (l.origem || '') !== 'landing_seja_afiliado');

    // Filtro de busca por texto (nome, e-mail, WhatsApp, empresa, CNPJ)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.nome?.toLowerCase().includes(q) ||
          l.whatsapp?.includes(search) ||
          l.email?.toLowerCase().includes(q) ||
          l.empresa?.toLowerCase().includes(q) ||
          (l.cnpj && l.cnpj.replace(/\D/g, '').includes(search.replace(/\D/g, '')))
      );
    }

    // Filtro por origem
    if (filterOrigem) {
      if (filterOrigem === 'indicacao') {
        // Filtra leads que vieram de corretor (indicação)
        result = result.filter((l) => !!getCorretorSlug(l));
      } else {
        result = result.filter((l) => (l.origem || 'direto') === filterOrigem);
      }
    }

    // Filtro por corretor (slug, id em dados_pdf ou corretor_id)
    if (filterCorretor) {
      result = result.filter(
        (l) =>
          getCorretorSlug(l) === filterCorretor ||
          getCorretorId(l) === filterCorretor ||
          l.corretor_id === filterCorretor,
      );
    }

    return result;
  }, [leads, search, filterOrigem, filterCorretor]);

  // Lista única de corretores para o filtro (por slug ou corretor_id)
  const corretorOptions = useMemo(() => {
    const ids = new Set<string>();
    leads.forEach((l) => {
      const slug = getCorretorSlug(l);
      if (slug) ids.add(slug);
      if (l.corretor_id) ids.add(l.corretor_id);
    });
    return Array.from(ids).sort().map((id) => ({ value: id, label: corretorMap[id] || id }));
  }, [leads, corretorMap]);

  // Contagem de indicações
  const indicacoesCount = useMemo(() => leads.filter((l) => !!getCorretorSlug(l)).length, [leads]);

  const statusOptions = LEAD_STATUS.map((s) => ({
    value: s,
    label: statusConfig[s].label,
  }));

  const origemOptions = [
    { value: 'indicacao', label: '👤 Indicações (Corretor)' },
    { value: 'calculadora_economia', label: '🧮 Calculadora Economia' },
    { value: 'calculadora', label: '📋 Simule seu plano (Landing)' },
    { value: 'email_form', label: '📧 Completar cotação' },
    { value: 'scanner_pdf', label: '📄 Scanner Inteligente' },
    { value: 'manual', label: '✏️ Manual' },
    { value: 'site', label: '🌐 Site' },
    { value: 'landing', label: '🌐 Landing' },
    { value: 'hero_form', label: '📝 Formulário hero' },
  ];

  if (loading && leads.length === 0) return <PageLoading text="Carregando leads..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="LEADS"
        description={`Gestão completa de leads — ${leads.length} registros`}
        actionLabel="Novo Lead"
        onAction={() => setDialogOpen(true)}
      />

      {/* Stats por status */}
      <StatsGrid cols={5}>
        {(['novo', 'contatado', 'negociacao', 'proposta_enviada'] as LeadStatus[]).map((status) => {
          const cfg = statusConfig[status];
          const count = leads.filter((l) => l.status === status).length;
          return (
            <StatsCard
              key={status}
              label={cfg.label}
              value={count}
              onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
              active={filterStatus === status}
            />
          );
        })}
        <StatsCard
          key="indicacoes"
          label="Indicações"
          value={indicacoesCount}
          onClick={() => setFilterOrigem(filterOrigem === 'indicacao' ? '' : 'indicacao')}
          active={filterOrigem === 'indicacao'}
        />
      </StatsGrid>

      {/* Busca + Filtros */}
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome, e-mail, WhatsApp, empresa ou CNPJ..."
        />
        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusOptions}
          placeholder="Todos os status"
        />
        <FilterSelect
          value={filterOrigem}
          onChange={setFilterOrigem}
          options={origemOptions}
          placeholder="Todas as origens"
        />
        {corretorOptions.length > 0 && (
          <FilterSelect
            value={filterCorretor}
            onChange={setFilterCorretor}
            options={corretorOptions}
            placeholder="Todos os corretores"
          />
        )}
      </div>

      {/* Tabela */}
      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        rowKey={(row) => row.id}
        emptyIcon={Users}
        emptyTitle="Nenhum lead encontrado"
        emptyDescription="Cadastre um lead manualmente ou use o Scanner Inteligente"
        onRowClick={async (lead) => {
          const res = await getCardByLeadId(lead.id);
          if (res.success && res.data) {
            router.push(`/portal-interno-hks-2026/leads/card/${res.data.cardId}`);
            return;
          }
          setSelectedLead(lead);
          setDrawerOpen(true);
        }}
      />

      {/* Modal Novo Lead */}
      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadLeads}
      />

      {/* Drawer Detalhes do Lead */}
      <LeadDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        lead={selectedLead}
      />
    </div>
  );
}
