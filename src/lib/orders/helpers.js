// Pure helpers, safe on server and client.

export const clean = (v) => String(v ?? '').trim();

export function normalizeDigits(s) {
  return String(s ?? '').replace(/[০-৯]/g, (c) => String('০১২৩৪৫৬৭৮৯'.indexOf(c)));
}

export function money(v) {
  const n = Number(normalizeDigits(v).replace(/,/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

// -> '01XXXXXXXXX' or '' when invalid
export function normalizePhone(v) {
  let s = normalizeDigits(clean(v)).replace(/[\s-]/g, '').replace(/^\+?88/, '');
  if (/^1[3-9]\d{8}$/.test(s)) s = `0${s}`;
  return /^01[3-9]\d{8}$/.test(s) ? s : '';
}

// -> '8801XXXXXXXXX' for wa.me links
export function waPhone(v) {
  const s = normalizeDigits(String(v ?? '')).replace(/[^0-9]/g, '');
  if (s.startsWith('880')) return s;
  if (s.startsWith('0')) return `880${s.slice(1)}`;
  if (/^1[3-9]\d{8}$/.test(s)) return `880${s}`;
  return s;
}

export function normalizeSize(s) {
  const x = clean(s).toUpperCase().replace(/\s/g, '');
  if (x === 'XXXL' || x === '3XL') return 'XXXL';
  if (x === 'XXL' || x === '2XL') return 'XXL';
  return ['S', 'M', 'L', 'XL'].includes(x) ? x : '';
}

export function todayDhaka() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
}

export const isIsoDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

export const isOn = (v) => ['YES', 'TRUE', '1'].includes(String(v ?? '').trim().toUpperCase());

// Supports the old app's placeholders too ({name}, {groupLink}, {riderName} ...).
export function renderTemplate(tpl, vars = {}) {
  const alias = {
    name: 'customer_name', customerName: 'customer_name',
    groupLink: 'group_link', riderName: 'rider_name', riderPhone: 'rider_phone',
    issue: 'rider_note', riderNote: 'rider_note', orderNo: 'order_no',
  };
  return String(tpl ?? '').replace(/\{(\w+)\}/g, (m, key) => {
    const k = alias[key] ?? key;
    return vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m;
  });
}

export function itemsSummary(items = []) {
  return items
    .map((i) => {
      const parts = [i.title];
      if (i.size) parts.push(`(${i.size})`);
      if (Number(i.quantity) > 1) parts.push(`x${i.quantity}`);
      const extra = [i.customization?.name, i.customization?.number].filter(Boolean).join(' ');
      return parts.join(' ') + (extra ? ` - ${extra}` : '') + (i.note ? ` - ${i.note}` : '');
    })
    .join(', ');
}

export function maskSecret(s) {
  const v = clean(s);
  if (!v) return '';
  if (v.length <= 8) return '••••••••';
  return `${v.slice(0, 4)}••••••••${v.slice(-4)}`;
}

export function waLink(phone, text) {
  return `https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(text)}`;
}
