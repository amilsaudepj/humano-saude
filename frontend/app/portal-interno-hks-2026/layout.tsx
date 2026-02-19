import { headers } from 'next/headers';
import DashboardLayoutClient from './DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug');
  const tenantDomain = headersList.get('x-tenant-domain');

  return (
    <DashboardLayoutClient tenantSlug={tenantSlug} tenantDomain={tenantDomain}>
      {children}
    </DashboardLayoutClient>
  );
}
