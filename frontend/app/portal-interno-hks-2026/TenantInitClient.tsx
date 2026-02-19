'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenantStore } from '@/stores/tenant-store';
import type { Tenant } from '@/lib/types/tenant';

interface TenantInitClientProps {
  /** Slug do tenant detectado pelo proxy via domínio customizado */
  tenantSlug: string;
  /** Domínio de origem — guardado no store para uso em redirects */
  tenantDomain: string | null;
}

/**
 * Componente headless que inicializa o TenantStore a partir
 * do slug injetado pelo proxy (X-Tenant-Slug).
 *
 * Montado apenas quando acessado via domínio customizado
 * (ex: mattosconnect.com.br/portal).
 *
 * Sem isso, o useTenant() usa a lógica de cookie corretor_token/admin_session
 * que não detecta o domínio customizado automaticamente.
 */
export default function TenantInitClient({ tenantSlug, tenantDomain }: TenantInitClientProps) {
  const { myTenant, setMyTenant } = useTenantStore();

  useEffect(() => {
    // Só inicializa se ainda não tem o tenant correto carregado
    if (myTenant?.slug === tenantSlug) return;

    async function initTenant() {
      try {
        const { data } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', tenantSlug)
          .eq('is_active', true)
          .single();

        if (data) {
          setMyTenant(data as Tenant);
        }
      } catch {
        // Falha silenciosa — cai para o tema default
      }
    }

    initTenant();
  }, [tenantSlug, myTenant?.slug, setMyTenant]);

  // Persiste o domínio de origem no sessionStorage para redirects pós-login
  useEffect(() => {
    if (tenantDomain) {
      sessionStorage.setItem('tenant_domain', tenantDomain);
      sessionStorage.setItem('tenant_slug', tenantSlug);
    }
  }, [tenantDomain, tenantSlug]);

  return null;
}
