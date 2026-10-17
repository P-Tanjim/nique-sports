import { requireAdmin } from '@/lib/admin/guard';

export const metadata = {
  title: 'Admin | Nique Sports',
  robots: { index: false, follow: false },
};

// Never cached, never static: what's rendered depends on who is signed in.
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  // Signed out -> /sign-in. Signed in but not an admin -> 404.
  // Pages and data calls check again themselves, because layouts are not
  // re-run on every client-side navigation.
  await requireAdmin();

  return (
    // Bottom padding keeps the last row clear of the fixed mobile bottom bar.
    <div className="mx-auto w-full max-w-350 px-4 pb-28 pt-6 sm:px-6 lg:px-8 min-[1050px]:pb-12">
      {children}
    </div>
  );
}
