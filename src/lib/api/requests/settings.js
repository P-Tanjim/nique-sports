'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/admin/guard';
import { clean } from '@/lib/orders/helpers';
import { UserError } from '@/lib/orders/validate';
import { ensureSchema } from '@/lib/sheets/client';
import { geminiCreds, getSettings, saveSettings as writeSettings, steadfastCreds } from '@/lib/sheets/settings';
import { listModerators, saveModerator } from '@/lib/services/moderators';
import { getBalance } from '@/lib/services/steadfast';
import { parseOrderWithGemini } from '@/lib/services/gemini';

// ADMIN ONLY. Only whitelisted keys can be written. Secret fields: empty = keep the old value.

const BOOL = ['Steadfast Enabled', 'Auto Courier Sync', 'AI Parser Enabled'];
const SECRET = ['Steadfast API Key', 'Steadfast Secret Key', 'Steadfast Webhook Token', 'Gemini API Key'];
const TEMPLATE = ['Review Template', 'Rider Alert Template', 'Rider Issue Template', 'Promo Template'];

async function run(fn) {
  try { return await fn(); } catch (e) {
    if (e instanceof UserError) return { success: false, error: e.message };
    if (e?.message === 'UNAUTHORIZED') return { success: false, error: 'You are not allowed to do this.' };
    console.error('settings action failed:', e);
    return { success: false, error: String(e?.message || 'Something went wrong.').slice(0, 200) };
  }
}

export async function saveSettings(input) {
  return run(async () => {
    await assertAdmin();
    const patch = {};
    for (const [key, raw] of Object.entries(input ?? {})) {
      if (BOOL.includes(key)) patch[key] = raw ? 'YES' : 'NO';
      else if (SECRET.includes(key)) {
        const v = clean(raw);
        if (v) { if (v.length > 300 || /\s/.test(v)) throw new UserError(`${key} looks invalid.`); patch[key] = v; }
      } else if (TEMPLATE.includes(key)) {
        const v = String(raw ?? '').trim();
        if (v.length > 1500) throw new UserError(`${key} is too long (max 1500).`);
        patch[key] = v;
      } else if (key === 'Gemini Model') {
        const v = clean(raw);
        if (!/^[\w.\-]{3,60}$/.test(v)) throw new UserError('Gemini model name is not valid.');
        patch[key] = v;
      } else if (key === 'Review Group Link') {
        const v = clean(raw);
        if (v && !/^https?:\/\/\S{3,490}$/.test(v)) throw new UserError('Group link must start with http(s)://');
        patch[key] = v;
      } else if (key === 'Default Commission' || key === 'Discount Percent') {
        const n = Number(raw);
        const max = key === 'Discount Percent' ? 100 : 10_000;
        if (!Number.isFinite(n) || n < 0 || n > max) throw new UserError(`${key} must be between 0 and ${max}.`);
        patch[key] = n;
      }
      // unknown keys are ignored on purpose
    }
    if (Object.keys(patch).length) await writeSettings(patch);
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/orders');
    return { success: true };
  });
}

export async function saveModeratorConfig(id, { commission, active }) {
  return run(async () => {
    await assertAdmin();
    const mod = (await listModerators()).find((m) => m.id === clean(id));
    if (!mod) throw new UserError('Moderator not found. Set userRole to "moderator" in the database first.');
    const c = Number(commission);
    if (!Number.isFinite(c) || c < 0 || c > 10_000) throw new UserError('Commission must be between 0 and 10,000.');
    await saveModerator(mod.id, mod.name, { commission: c, active: Boolean(active) });
    revalidatePath('/dashboard/settings');
    return { success: true };
  });
}

export async function testSteadfast() {
  return run(async () => {
    await assertAdmin();
    const creds = steadfastCreds(await getSettings());
    if (!creds.apiKey || !creds.secretKey) throw new UserError('Save the Steadfast API key and secret key first.');
    const data = await getBalance(creds);
    return { success: true, message: `Connected. Balance: ${data.current_balance ?? '?'}৳` };
  });
}

export async function testGemini() {
  return run(async () => {
    await assertAdmin();
    const creds = geminiCreds(await getSettings());
    if (!creds.apiKey) throw new UserError('Save the Gemini API key first.');
    const r = await parseOrderWithGemini('Rahim 01712345678 Dhaka Mirpur 10, Argentina away retro M cod 700', creds);
    return { success: true, message: `Works. Parsed: ${r.customerName || 'no name'}, ${r.phone || 'no phone'}` };
  });
}

export async function prepareSheet() {
  return run(async () => {
    await assertAdmin();
    const r = await ensureSchema();
    return { success: true, message: `Sheet ready. ${r.created} tab(s) created, ${r.seeded} setting(s) added.` };
  });
}
