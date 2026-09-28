// →  src/app/checkout/page.jsx
import CheckoutClient from '../../components/checkout/CheckoutClient';

export const metadata = {
  title: 'Checkout | NIQUE SPORTS',
  robots: { index: false, follow: false },
};

// Server Component shell. The cart lives in the browser's localStorage, so
// everything interactive sits in <CheckoutClient />.
export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-surface text-text">
      <CheckoutClient />
    </main>
  );
}