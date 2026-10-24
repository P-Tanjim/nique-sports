import { requireStaff } from '@/lib/admin/guard';

export const metadata = {
  title: 'Admin | Nique Sports',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  // Signed out -> /sign-in. Signed in but neither admin nor moderator -> 404.
  // Admin-only pages call requireAdmin() themselves (layouts don't re-run on client navigation).
  await requireStaff();

  return (
    <div className="mx-auto w-full max-w-350 px-4 pb-28 pt-6 sm:px-6 lg:px-8 min-[1050px]:pb-12">
      {children}
    </div>
  );
}
