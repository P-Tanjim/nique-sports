import { requireAdmin } from '@/lib/admin/guard';
import { getBanners } from '@/lib/api/banners';
import BannerManager from '@/components/dashboard/banners/BannerManager';
import DataError from '@/components/dashboard/DataError';

export const metadata = {
  title: 'Banner & Category Images | Admin | NIQUE SPORTS',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  await requireAdmin();

  let banners;
  try {
    banners = await getBanners();
  } catch (error) {
    console.error('Failed to load banners:', error);
    return <DataError title="Couldn't load banners" />;
  }

  return <BannerManager initialBanners={banners} />;
}
