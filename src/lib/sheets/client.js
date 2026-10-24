import 'server-only';
import { createSign } from 'node:crypto';
import { DEFAULT_SETTINGS, TAB_DEFS, colOf, lastCol, objToRow, rowToObj, valueForCell } from './schema';

// Tiny Google Sheets REST client (no googleapis package).
// Optimisations: cached + de-duplicated access token, one batchGet for multi-tab
// reads, single-cell patches (no whole-row clobbering), auto-retry on 401/429/5xx.
//
// ENV: GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEET_ID

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

let tokenCache = { value: null, exp: 0 };
let tokenInflight = null;
let schemaInflight = null;
let sheetIds = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const enc = encodeURIComponent;

function creds() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const id = process.env.GOOGLE_SHEET_ID;
  if (!email || !key || !id) throw new Error('Google Sheets env vars are missing (GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY / GOOGLE_SHEET_ID).');
  return { email, key, id };
}

async function fetchToken() {
  const { email, key } = creds();
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(key).toString('base64url');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Google auth failed.');
  tokenCache = { value: data.access_token, exp: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return tokenCache.value;
}

async function getToken() {
  if (tokenCache.value && Date.now() < tokenCache.exp - 60_000) return tokenCache.value;
  tokenInflight ??= fetchToken().finally(() => { tokenInflight = null; });
  return tokenInflight;
}

async function call(path, { method = 'GET', query, body } = {}, attempt = 0) {
  const { id } = creds();
  const url = new URL(`${BASE}/${id}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    (Array.isArray(v) ? v : [v]).forEach((x) => url.searchParams.append(k, x));
  }
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });

  if (res.status === 401 && attempt === 0) {
    tokenCache = { value: null, exp: 0 };
    return call(path, { method, query, body }, attempt + 1);
  }
  if ((res.status === 429 || res.status >= 500) && attempt < 2) {
    await sleep(500 * 2 ** attempt);
    return call(path, { method, query, body }, attempt + 1);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err.error?.message || res.statusText);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

// If a tab is missing the API answers 400 "Unable to parse range" -> build it once, retry once.
async function withSchema(fn) {
  try {
    return await fn();
  } catch (e) {
    if (e.status === 400 && /unable to parse range|not found/i.test(e.message)) {
      await ensureSchema();
      return fn();
    }
    throw e;
  }
}

/* ------------------------------ schema ------------------------------ */

export async function ensureSchema() {
  schemaInflight ??= (async () => {
    const meta = await call('', { query: { fields: 'sheets.properties(sheetId,title)' } });
    const existing = new Set(meta.sheets.map((s) => s.properties.title));
    const requests = Object.values(TAB_DEFS)
      .filter((d) => !existing.has(d.name))
      .map((d) => ({ addSheet: { properties: { title: d.name, gridProperties: { frozenRowCount: 1 } } } }));
    if (requests.length) await call(':batchUpdate', { method: 'POST', body: { requests } });

    await call('/values:batchUpdate', {
      method: 'POST',
      body: {
        valueInputOption: 'RAW',
        data: Object.values(TAB_DEFS).map((d) => ({ range: `${d.name}!A1`, values: [d.cols.map((c) => c[1])] })),
      },
    });

    const keys = await call(`/values/${enc('Settings!A2:A')}`);
    const have = new Set((keys.values ?? []).map((r) => r[0]));
    const missing = Object.entries(DEFAULT_SETTINGS).filter(([k]) => !have.has(k));
    if (missing.length) {
      await call(`/values/${enc('Settings!A1')}:append`, {
        method: 'POST',
        query: { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' },
        body: { values: missing.map(([k, v]) => [k, v]) },
      });
    }
    sheetIds = null;
    return { created: requests.length, seeded: missing.length };
  })().finally(() => { schemaInflight = null; });
  return schemaInflight;
}

async function sheetIdOf(tabKey) {
  if (!sheetIds) {
    const meta = await call('', { query: { fields: 'sheets.properties(sheetId,title)' } });
    sheetIds = Object.fromEntries(meta.sheets.map((s) => [s.properties.title, s.properties.sheetId]));
  }
  return sheetIds[TAB_DEFS[tabKey].name];
}

/* ------------------------------- reads ------------------------------ */

// Reads several tabs in ONE API call -> { orders: [...], transactions: [...] }
export async function readObjects(tabKeys) {
  const keys = Array.isArray(tabKeys) ? tabKeys : [tabKeys];
  const data = await withSchema(() =>
    call('/values:batchGet', {
      query: {
        ranges: keys.map((k) => `${TAB_DEFS[k].name}!A2:${lastCol(k)}`),
        valueRenderOption: 'UNFORMATTED_VALUE',
      },
    })
  );
  const out = {};
  keys.forEach((k, i) => {
    const rows = data.valueRanges?.[i]?.values ?? [];
    const first = TAB_DEFS[k].cols[0][0];
    out[k] = rows.map((row, idx) => rowToObj(k, row, idx + 2)).filter((o) => o[first] !== '');
  });
  return out;
}

// Reads only some columns (cheap) -> { createdAt: [...], phone: [...] } aligned by row
export async function readColumns(tabKey, colKeys) {
  const data = await withSchema(() =>
    call('/values:batchGet', {
      query: {
        ranges: colKeys.map((c) => `${TAB_DEFS[tabKey].name}!${colOf(tabKey, c)}2:${colOf(tabKey, c)}`),
        valueRenderOption: 'UNFORMATTED_VALUE',
      },
    })
  );
  const out = {};
  colKeys.forEach((c, i) => { out[c] = (data.valueRanges?.[i]?.values ?? []).map((r) => r[0] ?? ''); });
  return out;
}

export async function findRowById(tabKey, id, idKey = 'id') {
  const cols = await readColumns(tabKey, [idKey]);
  const idx = cols[idKey].findIndex((v) => String(v) === String(id));
  return idx === -1 ? null : idx + 2;
}

/* ------------------------------ writes ------------------------------ */

// Appends objects, returns the first row number written.
export async function appendObjects(tabKey, objs) {
  if (!objs.length) return null;
  const res = await withSchema(() =>
    call(`/values/${enc(`${TAB_DEFS[tabKey].name}!A1`)}:append`, {
      method: 'POST',
      query: { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' },
      body: { values: objs.map((o) => objToRow(tabKey, o)) },
    })
  );
  const m = /!?[A-Z]+(\d+):[A-Z]+\d+$/.exec(res.updates?.updatedRange ?? '');
  return m ? Number(m[1]) : null;
}

// Patches only the given keys of many rows in ONE call: [{ tabKey, row, patch }]
export async function patchCells(list) {
  const data = [];
  for (const { tabKey, row, patch } of list) {
    for (const [key, value] of Object.entries(patch)) {
      if (!TAB_DEFS[tabKey].cols.some((c) => c[0] === key)) continue;
      data.push({ range: `${TAB_DEFS[tabKey].name}!${colOf(tabKey, key)}${row}`, values: [[valueForCell(tabKey, key, value)]] });
    }
  }
  if (!data.length) return;
  await withSchema(() => call('/values:batchUpdate', { method: 'POST', body: { valueInputOption: 'RAW', data } }));
}

export async function deleteRow(tabKey, row) {
  const sheetId = await sheetIdOf(tabKey);
  await call(':batchUpdate', {
    method: 'POST',
    body: { requests: [{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: row - 1, endIndex: row } } }] },
  });
}
