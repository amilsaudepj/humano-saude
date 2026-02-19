import { headers } from 'next/headers';
import TenantLoginClient from './TenantLoginClient';

// Busca dados básicos do tenant para branding da página de login
async function getTenantBranding(slug: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=name,logo_url,primary_color,secondary_color&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 300 }, // cache 5 min
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

export default async function PortalLoginPage() {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug');
  const tenantDomain = headersList.get('x-tenant-domain');

  // Se veio de domínio customizado, busca branding do tenant
  const branding = tenantSlug ? await getTenantBranding(tenantSlug) : null;

  return (
    <TenantLoginClient
      tenantSlug={tenantSlug}
      tenantDomain={tenantDomain}
      branding={branding}
    />
  );
}
