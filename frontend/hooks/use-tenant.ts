'use client';

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenantStore } from '@/stores/tenant-store';
import type { Tenant } from '@/lib/types/tenant';
import { HUMANO_TENANT_ID } from '@/lib/types/tenant';

// Cache em memória para evitar re-fetch desnecessário
let _fetchPromise: Promise<void> | null = null;

function getCorretorIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const token = document.cookie
      .split('; ')
      .find((c) => c.startsWith('corretor_token='))
      ?.split('=')[1];
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.corretor_id || null;
  } catch {
    return null;
  }
}

function isAdminSession(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('admin_session=');
}

// ─── Hook principal ───────────────────────────────────────
export function useTenant() {
  const { myTenant, activeTenant, allTenants, isViewingOtherTenant, setMyTenant, setAllTenants } =
    useTenantStore();

  const fetchTenant = useCallback(async () => {
    // Evitar fetch paralelo duplicado
    if (_fetchPromise) return _fetchPromise;

    _fetchPromise = (async () => {
      try {
        const corretorId = getCorretorIdFromCookie();
        const isAdmin = isAdminSession();

        if (!corretorId && !isAdmin) return;

        if (corretorId) {
          // Corretor logado: busca o tenant pelo tenant_id do corretor
          const { data: corretor } = await supabase
            .from('corretores')
            .select('tenant_id, role')
            .eq('id', corretorId)
            .single();

          if (!corretor?.tenant_id) return;

          const { data: tenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', corretor.tenant_id)
            .eq('is_active', true)
            .single();

          if (tenant) {
            setMyTenant(tenant as Tenant);

            // Se o corretor é Super-Admin (tenant master), carregar todos os tenants
            if (tenant.is_master && ['admin', 'administrador'].includes(corretor.role)) {
              const { data: allTenantsData } = await supabase
                .from('tenants')
                .select('*')
                .eq('is_active', true)
                .order('name');

              if (allTenantsData) setAllTenants(allTenantsData as Tenant[]);
            }
          }
        } else if (isAdmin) {
          // Admin do portal interno: sempre no tenant Humano Saúde
          const { data: tenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', HUMANO_TENANT_ID)
            .single();

          if (tenant) {
            setMyTenant(tenant as Tenant);

            // Admin sempre carrega todos os tenants para o seletor
            const { data: allTenantsData } = await supabase
              .from('tenants')
              .select('*')
              .eq('is_active', true)
              .order('name');

            if (allTenantsData) setAllTenants(allTenantsData as Tenant[]);
          }
        }
      } catch {
        // Falha silenciosa — o tema cai para o default (dourado Humano)
      } finally {
        _fetchPromise = null;
      }
    })();

    return _fetchPromise;
  }, [setMyTenant, setAllTenants]);

  useEffect(() => {
    // Só faz fetch se ainda não tiver o tenant carregado
    if (!myTenant) fetchTenant();
  }, [myTenant, fetchTenant]);

  return {
    tenant: activeTenant,
    myTenant,
    allTenants,
    isViewingOtherTenant,
    isMasterAdmin: myTenant?.is_master ?? false,
    // Feature flags do tenant ativo
    features: activeTenant?.features ?? {},
    hasFeature: (key: string) => activeTenant?.features?.[key] === true,
    isLoading: !activeTenant,
    refetch: fetchTenant,
  };
}
