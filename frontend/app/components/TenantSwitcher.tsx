'use client';

import { useState } from 'react';
import { Check, ChevronDown, Building2, Globe, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTenant } from '@/hooks/use-tenant';
import { useTenantStore } from '@/stores/tenant-store';
import type { Tenant } from '@/lib/types/tenant';

// ─── TenantSwitcher ────────────────────────────────────────
// Visível apenas para Super-Admin (tenant mestre).
// Permite trocar o contexto de visualização entre corretoras
// sem fazer logout — os dados do dashboard filtram pelo tenant ativo.

export function TenantSwitcher() {
  const { tenant, allTenants, isMasterAdmin, isViewingOtherTenant, myTenant } = useTenant();
  const { setActiveTenant, resetToMyTenant } = useTenantStore();
  const [open, setOpen] = useState(false);

  // Só renderiza para Super-Admin com múltiplos tenants
  if (!isMasterAdmin || allTenants.length <= 1) return null;

  const handleSelect = (t: Tenant) => {
    setActiveTenant(t);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
          'border border-white/10 hover:border-white/20',
          isViewingOtherTenant
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-white/5 text-white/70 hover:text-white'
        )}
      >
        {/* Bolinha colorida do tenant ativo */}
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: tenant?.primary_color ?? '#D4AF37' }}
        />

        <span className="max-w-[120px] truncate hidden sm:block">
          {tenant?.name ?? 'Humano Saúde'}
        </span>

        {isViewingOtherTenant && (
          <span className="hidden sm:flex items-center gap-1 text-xs text-amber-400/70">
            <Eye className="h-3 w-3" />
            visualizando
          </span>
        )}

        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute right-0 top-full mt-2 z-50 w-64',
                'bg-[#0d0d0d] border border-white/10 rounded-xl shadow-2xl',
                'overflow-hidden'
              )}
            >
              {/* Header */}
              <div className="px-3 py-2.5 border-b border-white/5">
                <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
                  Contexto de visualização
                </p>
              </div>

              {/* Lista de tenants */}
              <div className="p-1.5 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {allTenants.map((t) => {
                  const isActive = tenant?.id === t.id;
                  const isOwn = myTenant?.id === t.id;

                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelect(t)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                        'transition-all hover:bg-white/5',
                        isActive && 'bg-white/8'
                      )}
                    >
                      {/* Cor do tenant */}
                      <div
                        className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: `${t.primary_color}22` }}
                      >
                        {t.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.logo_url}
                            alt={t.name}
                            className="h-5 w-5 object-contain"
                          />
                        ) : (
                          <Building2
                            className="h-4 w-4"
                            style={{ color: t.primary_color }}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-white truncate">
                            {t.name}
                          </span>
                          {isOwn && (
                            <span className="text-xs text-white/30 shrink-0">(meu)</span>
                          )}
                          {t.is_master && (
                            <Globe className="h-3 w-3 text-white/30 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-white/40 truncate">
                          {t.slug} · {t.plan}
                        </p>
                      </div>

                      {isActive && (
                        <Check className="h-4 w-4 text-white/60 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer: voltar para o próprio tenant */}
              {isViewingOtherTenant && (
                <div className="p-1.5 border-t border-white/5">
                  <button
                    onClick={() => { resetToMyTenant(); setOpen(false); }}
                    className="w-full px-3 py-2 rounded-lg text-xs text-amber-400 hover:bg-amber-500/10 transition-all text-left"
                  >
                    ↩ Voltar para {myTenant?.name}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
