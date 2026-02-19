import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { LPAmilPJForm } from './LPAmilPJForm';
import type { Tenant } from '@/lib/types/tenant';

// ─── Supabase server (service role para ler tenants) ──────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Params {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<Record<string, string>>;
}

// Busca o tenant pelo slug — usada tanto no metadata quanto na página
async function getTenant(slug: string): Promise<Tenant | null> {
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  return data as Tenant | null;
}

// ─── SEO dinâmico por tenant ──────────────────────────────────
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenant(tenantSlug);

  const tenantName = tenant?.name ?? 'Humano Saúde';
  const title = `Plano de Saúde Amil PJ | ${tenantName}`;
  const description = `Economize até 40% no plano empresarial Amil para sua empresa. Cotação gratuita com especialistas da ${tenantName}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    // Pixel/GTM é carregado dinamicamente via TenantPixel no client
    other: {
      'tenant-slug': tenantSlug,
    },
  };
}

// ─── Página da LP (RSC) ────────────────────────────────────────
export default async function AmilPJPage({ params, searchParams }: Params) {
  const { tenant: tenantSlug } = await params;
  const utmParams = await searchParams;
  const tenant = await getTenant(tenantSlug);

  if (!tenant) notFound();

  return (
    <main
      className="min-h-screen"
      style={{
        '--lp-primary': tenant.primary_color,
        '--lp-secondary': tenant.secondary_color,
        '--lp-accent': tenant.accent_color,
      } as React.CSSProperties}
    >
      {/* Pixel Meta dinâmico por tenant — renderizado via script inline */}
      {tenant.pixel_id_fb && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
              document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${tenant.pixel_id_fb}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* GTM dinâmico por tenant */}
      {tenant.tag_manager_id && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${tenant.tag_manager_id}');`,
          }}
        />
      )}

      <LPAmilPJForm
        tenant={tenant}
        utmSource={utmParams.utm_source}
        utmMedium={utmParams.utm_medium}
        utmCampaign={utmParams.utm_campaign}
      />
    </main>
  );
}
