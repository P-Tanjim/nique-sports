import 'server-only';
import { cache } from 'react';
import { DEFAULT_SETTINGS } from './schema';
import { appendObjects, patchCells, readObjects } from './client';
import { isOn } from '@/lib/orders/helpers';

// key/value settings tab, one cached read per request
export const getSettings = cache(async () => {
  const { settings } = await readObjects(['settings']);
  return toMap(settings);
});

export function toMap(rows) {
  const map = { ...DEFAULT_SETTINGS };
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export async function saveSettings(patch) {
  const { settings } = await readObjects(['settings']);
  const rowOf = new Map(settings.map((r) => [r.key, r._row]));
  const updates = [];
  const inserts = [];
  for (const [key, value] of Object.entries(patch)) {
    if (rowOf.has(key)) updates.push({ tabKey: 'settings', row: rowOf.get(key), patch: { value } });
    else inserts.push({ key, value });
  }
  if (updates.length) await patchCells(updates);
  if (inserts.length) await appendObjects('settings', inserts);
}

// secrets: sheet value wins, env var is the fallback
export function steadfastCreds(s) {
  return {
    apiKey: String(s['Steadfast API Key'] || process.env.STEADFAST_API_KEY || '').trim(),
    secretKey: String(s['Steadfast Secret Key'] || process.env.STEADFAST_SECRET_KEY || '').trim(),
  };
}

export const courierEnabled = (s) => {
  const c = steadfastCreds(s);
  return isOn(s['Steadfast Enabled']) && Boolean(c.apiKey && c.secretKey);
};

export const geminiCreds = (s) => ({
  apiKey: String(s['Gemini API Key'] || process.env.GEMINI_API_KEY || '').trim(),
  model: String(s['Gemini Model'] || 'gemini-2.5-flash').trim(),
});

export const aiEnabled = (s) => isOn(s['AI Parser Enabled']) && Boolean(geminiCreds(s).apiKey);

export const defaultCommission = (s) => Number(s['Default Commission']) || 0;
