'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Pencil, Globe, Power, PowerOff,
  CheckCircle, XCircle, Crown, ChevronRight, RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/PageHeader';
import { listTenants, toggleTenantStatus, type TenantWithDomains } from '@/app/actions/tenant-admin';
import TenantFormSheet from './TenantFormSheet';

// ─── Helpers ────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    trial:      { label: 'Trial',      cls: 'bg-gray-700 text-gray-300' },
    standard:   { label: 'Standard',   cls: 'bg-blue-900/60 text-blue-300' },
    pro:        { label: 'Pro',        cls: 'bg-purple-900/60 text-purple-300' },
    enterprise: { label: 'Enterprise', cls: 'bg-amber-900/60 text-amber-300' },
  };
  const m = map[plan] ?? map.standard;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}

function ColorDots({ primary, secondary, accent }: { primary: string; secondary: string; accent: string }) {
  return (
    <div className="flex items-center gap-1">
      {[primary, secondary, accent].map((c, i) => (
        <span
          key={i}
          className="inline-block h-4 w-4 rounded-full border border-white/10 shadow"
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantWithDomains[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithDomains | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isAdminRef = useRef(false);

  // Verificar se é super-admin via cookie JWT
  useEffect(() => {
    try {
      const token = document.cookie.split('; ').find(c => c.startsWith('admin_token='))?.split('=')[1];
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        isAdminRef.current = payload.role === 'admin' || payload.role === 'super-admin';
      }
    } catch { /* silent */ }
  }, []);

  const load = () => {
    setLoading(true);
    startTransition(async () => {
      const data = await listTenants();
      setTenants(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  function openNew() {
    setSelectedTenant(null);
    setSheetOpen(true);
  }

  function openEdit(t: TenantWithDomains) {
    setSelectedTenant(t);
    setSheetOpen(true);
  }

  async function handleToggle(t: TenantWithDomains) {
    if (t.is_master) { toast.error('Não é possível desativar o tenant master.'); return; }
    startTransition(async () => {
      const res = await toggleTenantStatus(t.id, !t.is_active);
      if (res.success) {
        toast.success(t.is_active ? `${t.name} desativada` : `${t.name} ativada`);
        load();
      } else {
        toast.error(res.error ?? 'Erro ao alterar status');
      }
    });
  }

  return (
    <div className="min-h-screen bg-brand-black p-6 space-y-6">
      <PageHeader
        title="Corretoras"
        description="Gerencie os tenants parceiros, suas identidades visuais e domínios"
        badge={String(tenants.length)}
        actionLabel="Nova Corretora"
        onAction={openNew}
      />

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: tenants.length, icon: Building2, color: '#D4AF37' },
          { label: 'Ativas', value: tenants.filter(t => t.is_active).length, icon: CheckCircle, color: '#22c55e' },
          { label: 'Inativas', value: tenants.filter(t => !t.is_active).length, icon: XCircle, color: '#ef4444' },
          { label: 'Domínios', value: tenants.reduce((acc, t) => acc + t.domains.length, 0), icon: Globe, color: '#60a5fa' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-gold-500/10 bg-[#0a0a0a] p-4 flex items-center gap-3">
            <div className="rounded-lg p-2" style={{ backgroundColor: `${color}20` }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-gold-500/10 bg-[#0a0a0a] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-gold-500" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
            <Building2 className="h-10 w-10 opacity-30" />
            <p>Nenhuma corretora cadastrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold-500/10 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Corretora</th>
                  <th className="px-4 py-3 text-left">Slug / Domínios</th>
                  <th className="px-4 py-3 text-left">Cores</th>
                  <th className="px-4 py-3 text-left">Plano</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {tenants.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-gold-500/5 hover:bg-white/2 transition-colors"
                    >
                      {/* Nome + Logo */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm"
                            style={{ backgroundColor: t.primary_color + '33', border: `1px solid ${t.primary_color}40` }}
                          >
                            {t.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={t.logo_url} alt={t.name} className="h-8 w-8 rounded object-contain" />
                            ) : (
                              <span style={{ color: t.primary_color }}>
                                {t.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-medium text-white">
                              {t.name}
                              {t.is_master && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                            </div>
                            {t.gestor_email && (
                              <p className="text-xs text-gray-500">{t.gestor_email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug + Domínios */}
                      <td className="px-4 py-3">
                        <code className="text-xs text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded">
                          /{t.slug}
                        </code>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {t.domains.slice(0, 2).map(d => (
                            <span key={d.id} className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded">
                              <Globe className="h-3 w-3" />
                              {d.domain}
                            </span>
                          ))}
                          {t.domains.length > 2 && (
                            <span className="text-xs text-gray-500">+{t.domains.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Cores */}
                      <td className="px-4 py-3">
                        <ColorDots
                          primary={t.primary_color}
                          secondary={t.secondary_color}
                          accent={t.accent_color}
                        />
                      </td>

                      {/* Plano */}
                      <td className="px-4 py-3">
                        <PlanBadge plan={t.plan} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            t.is_active
                              ? 'bg-green-900/40 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {t.is_active ? (
                            <><CheckCircle className="h-3 w-3" />Ativa</>
                          ) : (
                            <><XCircle className="h-3 w-3" />Inativa</>
                          )}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!t.is_master && (
                            <button
                              onClick={() => handleToggle(t)}
                              disabled={isPending}
                              className={`rounded-lg p-1.5 transition-colors ${
                                t.is_active
                                  ? 'text-red-400 hover:bg-red-900/30'
                                  : 'text-green-400 hover:bg-green-900/30'
                              }`}
                              title={t.is_active ? 'Desativar' : 'Ativar'}
                            >
                              {t.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(t)}
                            className="rounded-lg p-1.5 text-gold-500 hover:bg-gold-500/10 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sheet de formulário */}
      <TenantFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tenant={selectedTenant}
        onSaved={() => { setSheetOpen(false); load(); }}
      />

      {/* Aviso de segurança no rodapé */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-900/30 bg-amber-900/10 px-4 py-3 text-xs text-amber-400">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>
          Esta página é restrita a <strong>Super-Admin</strong>. Alterações aqui afetam diretamente os domínios e identidades visuais de todas as corretoras parceiras.
        </span>
      </div>
    </div>
  );
}
