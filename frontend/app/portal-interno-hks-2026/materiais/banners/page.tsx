'use client';

import BannerGenerator from '@/app/dashboard/corretor/components/BannerGenerator';

export default function BannersAdminPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <BannerGenerator corretorId={null} />
    </div>
  );
}
