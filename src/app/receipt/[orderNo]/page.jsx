import { OrderReceipt } from '@/components/receipt/OrderReceipt';

export const metadata = {
  title: 'Receipt | NIQUE SPORTS',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ReceiptPage({ params }) {
  const { orderNo } = await params;

  return (
    <main className="min-h-screen text-text">
      <div className="mx-auto flex max-w-350 flex-col items-center px-4 pb-32 pt-8">
        <h1 className="sr-only">Order receipt</h1>
        <OrderReceipt key={orderNo} orderNo={orderNo} />
      </div>
    </main>
  );
}

