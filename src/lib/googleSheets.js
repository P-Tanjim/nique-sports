// →  src/lib/googleSheets.js
//
// Minimal Google Sheets writer — no `googleapis` package needed. Signs a
// service-account JWT with Node's built-in crypto, exchanges it for an
// access token, then appends a row with the Sheets REST API directly.
// Zero new dependencies to install.
//
// ONE-TIME SETUP:
// 1. console.cloud.google.com → new (or existing) project → enable the
//    "Google Sheets API".
// 2. IAM & Admin → Service Accounts → Create service account → Keys →
//    Add key → JSON. Download it.
// 3. Open the downloaded JSON: copy `client_email` and `private_key`.
// 4. Open your target Google Sheet → Share → paste the client_email in as
//    an Editor. (This step is what actually grants write access — without
//    it you'll get a 403 no matter how correct the code is.)
// 5. Copy the Sheet ID from its URL:
//    https://docs.google.com/spreadsheets/d/<THIS_PART>/edit
// 6. Add a header row to the sheet tab (row 1), matching the column order
//    `submitOrder` writes in orders.js:
//    Order ID | Date | Name | Phone | Phone 2 | Address | Note |
//    Delivery Area | Delivery Fee | Subtotal | Total | Items |
//    Payment Method | Status
//
// ENV VARS TO ADD:
//   GOOGLE_SHEETS_CLIENT_EMAIL   the service account's client_email
//   GOOGLE_SHEETS_PRIVATE_KEY    the service account's private_key — if you
//                                paste it as one line, keep the \n escape
//                                sequences as-is; this file unescapes them
//   GOOGLE_SHEET_ID              the spreadsheet ID from the URL
//   GOOGLE_SHEET_NAME            tab name to append to (optional, "Orders")

import { createSign } from 'node:crypto';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

async function getAccessToken() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Missing GOOGLE_SHEETS_CLIENT_EMAIL or GOOGLE_SHEETS_PRIVATE_KEY env vars.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: clientEmail,
    scope: SHEETS_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600, // 1 hour — plenty for a single checkout submission
  };

  const unsignedToken = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;

  const signature = createSign('RSA-SHA256')
    .update(unsignedToken)
    .sign(privateKey)
    .toString('base64url');

  const assertion = `${unsignedToken}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Google auth token error:', data);
    throw new Error(data.error_description || 'Could not authenticate with Google Sheets.');
  }
  return data.access_token;
}

// Appends one row to the end of the sheet. `row` is a plain array — one
// entry per column, in the order your header row is in.
export async function appendRowToSheet(row) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Orders';

  if (!sheetId) throw new Error('Missing GOOGLE_SHEET_ID env var.');

  const accessToken = await getAccessToken();
  const range = encodeURIComponent(`${sheetName}!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Google Sheets append error:', data);
    throw new Error(data.error?.message || 'Could not save the order to Google Sheets.');
  }
  return data;
}