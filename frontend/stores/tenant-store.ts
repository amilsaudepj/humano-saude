'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tenant } from '@/lib/types/tenant';

// ─── Store global de contexto de tenant ────────────────────
// Usado pelo Super-Admin para trocar a visualização entre
// corretoras sem trocar de conta. Persiste em localStorage.

interface TenantStore {
  // Tenant do usuário logado (imutável por sessão)
  myTenant: Tenant | null;
  // Tenant ativo na UI (pode diferir de myTenant para Super-Admin)
  activeTenant: Tenant | null;
  // Todos os tenants disponíveis (carregado apenas para Super-Admin)
  allTenants: Tenant[];
  // Indica se o Super-Admin está visualizando um tenant diferente do seu
  isViewingOtherTenant: boolean;

  setMyTenant: (tenant: Tenant) => void;
  setActiveTenant: (tenant: Tenant) => void;
  setAllTenants: (tenants: Tenant[]) => void;
  resetToMyTenant: () => void;
}

export const useTenantStore = create<TenantStore>()(
  persist(
    (set) => ({
      myTenant: null,
      activeTenant: null,
      allTenants: [],
      isViewingOtherTenant: false,

      setMyTenant: (tenant) =>
        set({ myTenant: tenant, activeTenant: tenant, isViewingOtherTenant: false }),

      setActiveTenant: (tenant) =>
        set((state) => ({
          activeTenant: tenant,
          isViewingOtherTenant: state.myTenant?.id !== tenant.id,
        })),

      setAllTenants: (tenants) => set({ allTenants: tenants }),

      resetToMyTenant: () =>
        set((state) => ({
          activeTenant: state.myTenant,
          isViewingOtherTenant: false,
        })),
    }),
    {
      name: 'tenant-context',
      // Não persistir allTenants — re-fetch a cada sessão
      partialize: (state) => ({
        myTenant: state.myTenant,
        activeTenant: state.activeTenant,
      }),
    }
  )
);
