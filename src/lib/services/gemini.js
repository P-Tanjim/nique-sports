import 'server-only';
import { clean, money, normalizePhone, normalizeSize } from '@/lib/orders/helpers';

const PROMPT = `You extract a Bangladeshi jersey order from a customer chat message (Bangla, English or mixed).
Return ONLY JSON: {"customerName":"","phone":"","address":"","items":[{"title":"","size":"","quantity":1,"note":""}],"cod":0,"advance":0,"note":""}
Rules: phone = 11-digit BD number starting 01 (convert Bangla digits). size one of S,M,L,XL,XXL,XXXL (2XL=XXL, 3XL=XXXL) or "".
title = jersey/team/season/kit text; put name/number/patch/sleeve info in item note. cod = amount customer pays on delivery (number only).
advance = amount already paid (number only, 0 if none). Unknown values: empty string or 0. Do not invent data.`;

export async function parseOrderWithGemini(text, { apiKey, model }) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${PROMPT}\n\nMessage:\n${text.slice(0, 4000)}` }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(25_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `Gemini error ${res.status}`);

  const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  let parsed;
  try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch { throw new Error('AI returned an unreadable answer. Try again.'); }

  const items = (Array.isArray(parsed.items) ? parsed.items : []).slice(0, 20).map((i) => ({
    title: clean(i.title).slice(0, 150),
    size: normalizeSize(i.size),
    quantity: Math.min(50, Math.max(1, parseInt(i.quantity, 10) || 1)),
    note: clean(i.note).slice(0, 150),
  })).filter((i) => i.title);

  return {
    customerName: clean(parsed.customerName).slice(0, 100),
    phone: normalizePhone(parsed.phone) || normalizePhone(/(?:\+?88)?\s*(01[3-9][\d\s-]{8,12})/.exec(text)?.[1] ?? ''),
    address: clean(parsed.address).slice(0, 500),
    items,
    cod: money(parsed.cod),
    advance: money(parsed.advance),
    note: clean(parsed.note).slice(0, 1000),
  };
}
