import { headers } from 'next/headers';
import { requireAdmin } from '@/lib/admin/guard';
import SettingsClient from '@/components/dashboard/settings/SettingsClient';
import DataError from '@/components/dashboard/DataError';
import { maskSecret } from '@/lib/orders/helpers';
import { geminiCreds, getSettings, steadfastCreds } from '@/lib/sheets/settings';
import { listModerators } from '@/lib/services/moderators';

export const metadata = { title: 'Settings | NIQUE SPORTS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireAdmin();

  let s;
  let moderators;
  try {
    [s, moderators] = await Promise.all([getSettings(), listModerators()]);
  } catch (error) {
    console.error('Settings load failed:', error);
    return <DataError title="Couldn't load settings" />;
  }

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const sf = steadfastCreds(s);
  const gem = geminiCreds(s);

  // Secrets never leave the server: only a masked preview is sent to the browser.
  const initial = {
    steadfastEnabled: String(s['Steadfast Enabled']).toUpperCase() === 'YES',
    autoSync: String(s['Auto Courier Sync']).toUpperCase() === 'YES',
    aiEnabled: String(s['AI Parser Enabled']).toUpperCase() === 'YES',
    geminiModel: gem.model,
    defaultCommission: Number(s['Default Commission']) || 0,
    discountPercent: Number(s['Discount Percent']) || 0,
    groupLink: s['Review Group Link'] ?? '',
    templates: {
      review: s['Review Template'] ?? '',
      riderAlert: s['Rider Alert Template'] ?? '',
      riderIssue: s['Rider Issue Template'] ?? '',
      promo: s['Promo Template'] ?? '',
    },
  };
  const masked = {
    steadfastKey: maskSecret(sf.apiKey),
    steadfastSecret: maskSecret(sf.secretKey),
    webhookToken: maskSecret(s['Steadfast Webhook Token']),
    geminiKey: maskSecret(gem.apiKey),
  };

  return (
    <SettingsClient
      initial={initial}
      masked={masked}
      moderators={moderators}
      webhookUrl={`${proto}://${host}/api/steadfast/webhook`}
    />
  );
}
