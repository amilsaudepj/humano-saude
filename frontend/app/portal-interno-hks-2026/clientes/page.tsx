'use client';

import { useState, useEffect } from 'react';
import { Users, Phone, Eye } from 'lucide-react';
import { getClientes, getClienteStats } from '@/app/actions/clientes';
import {
  PageHeader,
  StatsCard,
  StatsGrid,
  SearchInput,
  DataTable,
  PageLoading,
} from '../components';
import type { Column } from '../components';
import { LeadDetailDrawer } from '../components/LeadDetailDrawer';

const columns: Column<any>[] = [
  {
    key: 'nome',
    header: 'Nome',
    sortable: true,
    render: (c) => <span className="font-medium text-white">{c.nome}</span>,
  },
  {
    key: 'whatsapp',
    header: 'WhatsApp',
    render: (c) =>
      c.whatsapp ? (
        <a
          href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-green-400 hover:text-green-300"
        >
          <Phone className="h-3.5 w-3.5" /> {c.whatsapp}
        </a>
      ) : (
        <span className="text-gray-500">—</span>
      ),
  },
  {
    key: 'email',
    header: 'Email',
    hidden: 'md',
    render: (c) => <span className="text-gray-300">{c.email || '—'}</span>,
  },
  {
    key: 'operadora_interesse',
    header: 'Operadora',
    hidden: 'md',
    sortable: true,
    render: (c) => <span className="text-gray-300">{c.operadora_interesse || '—'}</span>,
  },
  {
    key: 'valor_plano_atual',
    header: 'Valor',
    hidden: 'lg',
    sortable: true,
    render: (c) => (
      <span className="font-semibold text-[#D4AF37]">
        {c.valor_plano_atual ? `R$ ${Number(c.valor_plano_atual).toLocaleString('pt-BR')}` : '—'}
      </span>
    ),
  },
  {
    key: 'created_at',
    header: 'Desde',
    hidden: 'lg',
    sortable: true,
    render: (c) => (
      <span className="text-xs text-gray-400">
        {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}
      </span>
    ),
  },
];

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const [cRes, sRes] = await Promise.all([getClientes(), getClienteStats()]);
      if (cRes.success) setClientes(cRes.data || []);
      if (sRes.success) setStats(sRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = clientes.filter(
    (c) =>
      c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.whatsapp?.includes(search)
  );

  if (loading) return <PageLoading text="Carregando clientes..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="CLIENTES" description="Gestão da base de clientes ativos" />

      <StatsGrid cols={4}>
        <StatsCard label="Clientes Ativos" value={stats?.total_clientes || 0} icon={Users} />
        <StatsCard label="Propostas Ativas" value={stats?.propostas_ativas || 0} icon={Eye} color="text-green-400" />
        <StatsCard
          label="Receita Recorrente"
          value={stats?.receita_recorrente ? `R$ ${stats.receita_recorrente.toLocaleString('pt-BR')}` : 'R$ 0'}
        />
        <StatsCard
          label="Ticket Médio"
          value={stats?.ticket_medio ? `R$ ${stats.ticket_medio.toLocaleString('pt-BR')}` : 'R$ 0'}
        />
      </StatsGrid>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nome, email ou WhatsApp..."
      />

      <DataTable
        data={filtered}
        columns={columns}
        loading={false}
        rowKey={(row) => row.id}
        emptyIcon={Users}
        emptyTitle="Nenhum cliente encontrado"
        onRowClick={(cliente) => {
          setSelectedCliente(cliente);
          setDrawerOpen(true);
        }}
      />

      <LeadDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        lead={selectedCliente}
      />
    </div>
  );
}
