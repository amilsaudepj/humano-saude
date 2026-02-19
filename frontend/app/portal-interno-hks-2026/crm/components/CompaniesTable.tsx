'use client';

import {
  Building2, Users, DollarSign, Trash2, Globe, Phone, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable, type Column } from '../../components/DataTable';
import { SearchInput, FilterSelect } from '../../components';
import type { CrmCompanyEnriched, CrmCompanyFilters, CrmCompanySize } from '@/lib/types/crm';
import { CRM_COMPANY_SIZES } from '@/lib/types/crm';

// ========================================
// PORTE BADGE
// ========================================

const porteConfig: Record<string, { label: string; color: string; bg: string }> = {
  mei: { label: 'MEI', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  micro: { label: 'Micro', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  pequena: { label: 'Pequena', color: 'text-green-400', bg: 'bg-green-500/10' },
  media: { label: 'Média', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  grande: { label: 'Grande', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  enterprise: { label: 'Enterprise', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
};

function PorteBadge({ porte }: { porte: string | null }) {
  if (!porte) return <span className="text-white/20 text-xs">—</span>;
  const cfg = porteConfig[porte] ?? { label: porte, color: 'text-white/50', bg: 'bg-white/5' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', cfg.color, cfg.bg)}>
      {cfg.label}
    </span>
  );
}

function fmt(value: number | null | undefined): string {
  if (value == null) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ========================================
// COMPANIES TABLE
// ========================================

export default function CompaniesTable({
  companies,
  loading,
  total,
  page,
  perPage,
  filters,
  onFilterChange,
  onPageChange,
  onRowClick,
  onDelete,
}: {
  companies: CrmCompanyEnriched[];
  loading: boolean;
  total: number;
  page: number;
  perPage: number;
  filters: CrmCompanyFilters;
  onFilterChange: (f: Partial<CrmCompanyFilters>) => void;
  onPageChange: (p: number) => void;
  onRowClick: (c: CrmCompanyEnriched) => void;
  onDelete?: (id: string) => void;
}) {
  const columns: Column<CrmCompanyEnriched>[] = [
    {
      key: 'nome',
      header: 'Empresa',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.logo_url ? (
            <img src={c.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center text-purple-400 text-xs font-bold uppercase">
              {c.nome?.[0] ?? '?'}
            </div>
          )}
          <div>
            <p className="text-sm text-white font-medium">{c.nome}</p>
            {c.setor && <p className="text-[10px] text-white/30">{c.setor}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'cnpj',
      header: 'CNPJ',
      hidden: 'lg',
      render: (c) => <span className="text-sm text-white/50 font-mono">{c.cnpj ?? '—'}</span>,
    },
    {
      key: 'porte',
      header: 'Porte',
      sortable: true,
      render: (c) => <PorteBadge porte={c.porte} />,
    },
    {
      key: 'total_contacts',
      header: 'Contatos',
      sortable: true,
      hidden: 'md',
      render: (c) => (
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-white/20" />
          <span className="text-sm text-white/60">{c.total_contacts}</span>
        </div>
      ),
    },
    {
      key: 'total_deals',
      header: 'Oportunidades',
      sortable: true,
      hidden: 'md',
      render: (c) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-white/20" />
          <span className="text-sm text-white/60">{c.total_deals}</span>
          {c.valor_total_deals > 0 && (
            <span className="text-[10px] text-[#D4AF37] ml-1">{fmt(c.valor_total_deals)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'owner_nome',
      header: 'Responsável',
      hidden: 'xl',
      render: (c) => <span className="text-sm text-white/40">{c.owner_nome ?? '—'}</span>,
    },
    {
      key: 'created_at',
      header: 'Criado em',
      sortable: true,
      hidden: 'xl',
      render: (c) => (
        <span className="text-sm text-white/40">
          {new Date(c.created_at).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ];

  const porteOptions = CRM_COMPANY_SIZES.map((s) => ({
    value: s,
    label: porteConfig[s]?.label ?? s,
  }));

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar empresas..."
          value={filters.search ?? ''}
          onChange={(v) => onFilterChange({ search: v || undefined })}
        />
        <FilterSelect
          placeholder="Porte"
          value={filters.porte ?? ''}
          onChange={(v) => onFilterChange({ porte: (v || undefined) as CrmCompanySize | undefined })}
          options={porteOptions}
        />
      </div>

      {/* Table */}
      <DataTable<CrmCompanyEnriched>
        data={companies}
        columns={columns}
        loading={loading}
        rowKey={(c) => c.id}
        onRowClick={onRowClick}
        emptyTitle="Nenhuma empresa encontrada"
        emptyDescription="Adicione sua primeira empresa para começar"
        actions={onDelete ? (c) => (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : undefined}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">{total} empresas</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30"
            >
              Anterior
            </button>
            <span className="text-xs text-white/40">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
