'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Loader2, LogOut, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authClient } from '@/lib/auth-client';
import IOSSwitch from '@/components/dashboard/products/IOSSwitch';
import { prepareSheet, saveModeratorConfig, saveSettings, testGemini, testSteadfast } from '@/lib/api/requests/settings';

const inputClass = 'w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary';
const btn = 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

function Card({ title, hint, children }) {
  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</h2>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, children, note }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
      {children}
      {note && <span className="mt-1.5 block text-xs text-text-muted">{note}</span>}
    </label>
  );
}

function SecretInput({ label, masked, value, onChange }) {
  return (
    <Field label={label} note={masked ? `Saved: ${masked}. Leave empty to keep it.` : 'Not set yet.'}>
      <input type="password" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} placeholder={masked || 'Paste here'} className={inputClass} />
    </Field>
  );
}

export default function SettingsClient({ initial, masked, moderators, webhookUrl }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [s, setS] = useState(initial);
  const [keys, setKeys] = useState({ steadfastKey: '', steadfastSecret: '', webhookToken: '', geminiKey: '' });
  const [mods, setMods] = useState(() => Object.fromEntries(moderators.map((m) => [m.id, { commission: String(m.commission), active: m.active }])));
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.replace('/');
      router.refresh();
    } catch {
      toast.error('Failed to sign out.');
      setSigningOut(false);
    }
  }

  const set = (k, v) => setS((p) => ({ ...p, [k]: v }));
  const setTpl = (k, v) => setS((p) => ({ ...p, templates: { ...p.templates, [k]: v } }));

  async function act(name, fn, { refresh = false } = {}) {
    setBusy(name);
    try {
      const res = await fn();
      if (!res?.success) { toast.error(res?.error || 'Failed.'); return; }
      toast.success(res.message || 'Saved.');
      if (refresh) { setKeys({ steadfastKey: '', steadfastSecret: '', webhookToken: '', geminiKey: '' }); router.refresh(); }
    } catch {
      toast.error('Network or server error occurred.');
    } finally {
      setBusy('');
    }
  }

  const saveSteadfast = () => act('sf', () => saveSettings({
    'Steadfast Enabled': s.steadfastEnabled, 'Auto Courier Sync': s.autoSync,
    'Steadfast API Key': keys.steadfastKey, 'Steadfast Secret Key': keys.steadfastSecret, 'Steadfast Webhook Token': keys.webhookToken,
  }), { refresh: true });

  const saveAi = () => act('ai', () => saveSettings({
    'AI Parser Enabled': s.aiEnabled, 'Gemini Model': s.geminiModel, 'Gemini API Key': keys.geminiKey,
  }), { refresh: true });

  const saveTemplates = () => act('tpl', () => saveSettings({
    'Review Template': s.templates.review, 'Rider Alert Template': s.templates.riderAlert,
    'Rider Issue Template': s.templates.riderIssue, 'Promo Template': s.templates.promo,
    'Review Group Link': s.groupLink, 'Discount Percent': s.discountPercent,
  }));

  const saveGeneral = () => act('gen', () => saveSettings({ 'Default Commission': s.defaultCommission }));

  const genToken = () => setKeys((k) => ({ ...k, webhookToken: crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8) }));

  async function copyUrl() {
    try { await navigator.clipboard.writeText(webhookUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { toast.error('Could not copy.'); }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-text-muted">Integrations, moderators and message templates. Only admins can see this page.</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 active:scale-95 disabled:opacity-60"
        >
          {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} strokeWidth={1.8} />}
          <span>{signingOut ? 'Signing out...' : 'Log out'}</span>
        </button>
      </header>

      <Card title="Steadfast courier" hint="New orders are sent to Steadfast automatically and their status is synced back.">
        <IOSSwitch label="Enable Steadfast" description="Auto-send every new order (website + manual)" checked={s.steadfastEnabled} onChange={(v) => set('steadfastEnabled', v)} />
        <IOSSwitch label="Auto-sync statuses" description="Refresh open parcels when the orders page is opened" checked={s.autoSync} onChange={(v) => set('autoSync', v)} />
        <SecretInput label="API key" masked={masked.steadfastKey} value={keys.steadfastKey} onChange={(v) => setKeys((k) => ({ ...k, steadfastKey: v }))} />
        <SecretInput label="Secret key" masked={masked.steadfastSecret} value={keys.steadfastSecret} onChange={(v) => setKeys((k) => ({ ...k, steadfastSecret: v }))} />
        <div>
          <SecretInput label="Webhook token (optional, real-time updates)" masked={masked.webhookToken} value={keys.webhookToken} onChange={(v) => setKeys((k) => ({ ...k, webhookToken: v }))} />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <button type="button" onClick={genToken} className="cursor-pointer font-medium text-primary hover:underline">Generate a token</button>
            <span className="text-text-muted">· Callback URL:</span>
            <code className="rounded bg-surface px-2 py-1 text-text">{webhookUrl}</code>
            <button type="button" onClick={copyUrl} aria-label="Copy URL" className="cursor-pointer text-text-muted hover:text-text">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={saveSteadfast} disabled={busy === 'sf'} className={`${btn} bg-primary text-white hover:bg-primary-dark`}>{busy === 'sf' && <Loader2 size={15} className="animate-spin" />}Save</button>
          <button type="button" onClick={() => act('sft', testSteadfast)} disabled={busy === 'sft'} className={`${btn} border border-border bg-white text-text hover:bg-surface`}>{busy === 'sft' && <Loader2 size={15} className="animate-spin" />}Test connection</button>
        </div>
      </Card>

      <Card title="AI order entry (Gemini)" hint="Used on the Add order page by you and your moderators. The key stays on the server.">
        <IOSSwitch label="Enable AI entry" description="Moderators use your key, never see it" checked={s.aiEnabled} onChange={(v) => set('aiEnabled', v)} />
        <SecretInput label="Gemini API key" masked={masked.geminiKey} value={keys.geminiKey} onChange={(v) => setKeys((k) => ({ ...k, geminiKey: v }))} />
        <Field label="Model" note="If AI stops working, check Google AI Studio for the current model name."><input value={s.geminiModel} onChange={(e) => set('geminiModel', e.target.value)} className={inputClass} /></Field>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={saveAi} disabled={busy === 'ai'} className={`${btn} bg-primary text-white hover:bg-primary-dark`}>{busy === 'ai' && <Loader2 size={15} className="animate-spin" />}Save</button>
          <button type="button" onClick={() => act('gt', testGemini)} disabled={busy === 'gt'} className={`${btn} border border-border bg-white text-text hover:bg-surface`}>{busy === 'gt' && <Loader2 size={15} className="animate-spin" />}Test AI</button>
        </div>
      </Card>

      <Card title="Moderators" hint="To add one: the person signs up on the site, then set userRole to &quot;moderator&quot; on their user in MongoDB.">
        {moderators.length === 0 && <p className="text-sm text-text-muted">No moderators yet.</p>}
        {moderators.map((m) => (
          <div key={m.id} className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_130px_auto] sm:items-center">
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-text">{m.name}</p><p className="truncate text-xs text-text-muted">{m.email}</p></div>
            <Field label="৳ per delivered order"><input type="number" min="0" value={mods[m.id].commission} onChange={(e) => setMods((p) => ({ ...p, [m.id]: { ...p[m.id], commission: e.target.value } }))} className={inputClass} /></Field>
            <div className="flex items-center gap-3">
              <IOSSwitch label="Active" checked={mods[m.id].active} onChange={(v) => setMods((p) => ({ ...p, [m.id]: { ...p[m.id], active: v } }))} />
              <button type="button" onClick={() => act(`m${m.id}`, () => saveModeratorConfig(m.id, mods[m.id]), { refresh: true })} disabled={busy === `m${m.id}`} className={`${btn} bg-primary text-white hover:bg-primary-dark`}>{busy === `m${m.id}` ? <Loader2 size={15} className="animate-spin" /> : 'Save'}</button>
            </div>
          </div>
        ))}
        <Field label="Default commission for new moderators (৳ per delivered order)"><input type="number" min="0" value={s.defaultCommission} onChange={(e) => set('defaultCommission', e.target.value)} className={inputClass} /></Field>
        <button type="button" onClick={saveGeneral} disabled={busy === 'gen'} className={`${btn} bg-primary text-white hover:bg-primary-dark`}>{busy === 'gen' && <Loader2 size={15} className="animate-spin" />}Save default</button>
      </Card>

      <Card title="Message templates" hint="Placeholders: {customer_name} {order_no} {cod} {rider_name} {rider_phone} {rider_note} {discount} {group_link}">
        {[['review', 'Review message (order delivered, "Tell in WhatsApp")'], ['riderAlert', 'Rider alert (order pending, "Rider alert")'], ['riderIssue', 'Rider issue message'], ['promo', 'Promo message (used later)']].map(([k, label]) => (
          <Field key={k} label={label}><textarea rows={4} value={s.templates[k]} onChange={(e) => setTpl(k, e.target.value)} maxLength={1500} className={`${inputClass} resize-y`} /></Field>
        ))}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Review group link"><input value={s.groupLink} onChange={(e) => set('groupLink', e.target.value)} placeholder="https://…" className={inputClass} /></Field>
          <Field label="Discount %"><input type="number" min="0" max="100" value={s.discountPercent} onChange={(e) => set('discountPercent', e.target.value)} className={inputClass} /></Field>
        </div>
        <button type="button" onClick={saveTemplates} disabled={busy === 'tpl'} className={`${btn} bg-primary text-white hover:bg-primary-dark`}>{busy === 'tpl' && <Loader2 size={15} className="animate-spin" />}Save templates</button>
      </Card>

      <Card title="Google Sheet" hint="Creates the missing tabs and default settings in your NEW sheet. Safe to run again.">
        <button type="button" onClick={() => act('sheet', prepareSheet)} disabled={busy === 'sheet'} className={`${btn} border border-border bg-white text-text hover:bg-surface`}>{busy === 'sheet' ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}Prepare sheet</button>
      </Card>

      <Card title="Account session" hint="Sign out of your administrator account session on this browser.">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className={`${btn} border border-red-200 bg-red-50/70 text-red-600 hover:bg-red-100`}
        >
          {signingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
          <span>{signingOut ? 'Signing out...' : 'Log out'}</span>
        </button>
      </Card>
    </div>
  );
}
