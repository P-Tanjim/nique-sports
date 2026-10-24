// Column layout of the NEW website sheet. Rows are read/written by POSITION
// (not by header text), so don't reorder columns after you have data.
// Add new columns only at the END of a tab.

export const TAB_DEFS = {
  orders: {
    name: 'Orders',
    cols: [
      ['id', 'Record ID'], ['createdAt', 'Created At'], ['date', 'Date'], ['orderNo', 'Order No'],
      ['source', 'Source'], ['addedBy', 'By Whom'], ['moderatorId', 'Moderator ID'],
      ['customerName', 'Customer Name'], ['phone', 'Phone'], ['phone2', 'Phone 2'], ['address', 'Address'],
      ['deliveryArea', 'Delivery Area'], ['items', 'Items'], ['itemsJson', 'Items JSON'],
      ['subtotal', 'Subtotal'], ['deliveryFee', 'Delivery Fee'], ['total', 'Total'],
      ['advance', 'Advance'], ['advanceAccount', 'Advance Account'], ['cod', 'COD'],
      ['status', 'Status'], ['note', 'Note'],
      ['courierId', 'Courier ID'], ['trackingCode', 'Tracking Code'], ['courierStatus', 'Courier Status'],
      ['courierSyncedAt', 'Courier Synced At'], ['courierError', 'Courier Error'],
      ['riderName', 'Rider Name'], ['riderPhone', 'Rider Phone'], ['riderNote', 'Rider Note'],
      ['riderResolved', 'Rider Issue Resolved'],
      ['deliveryDate', 'Delivery Date'], ['commissionRate', 'Commission Rate'],
      ['deliveryCommission', 'Delivery Commission'], ['reviewSent', 'Review Sent'], ['updatedAt', 'Updated At'],
    ],
    numeric: ['subtotal', 'deliveryFee', 'total', 'advance', 'cod', 'commissionRate', 'deliveryCommission'],
  },
  transactions: {
    name: 'Transactions',
    cols: [
      ['id', 'Record ID'], ['createdAt', 'Created At'], ['date', 'Date'], ['type', 'Type'],
      ['from', 'From Account'], ['to', 'To Account'], ['amount', 'Amount'], ['reference', 'Reference'], ['note', 'Note'],
    ],
    numeric: ['amount'],
  },
  settings: {
    name: 'Settings',
    cols: [['key', 'Setting'], ['value', 'Value']],
    numeric: [],
  },
  moderators: {
    name: 'Moderators',
    cols: [['id', 'User ID'], ['name', 'Name'], ['commission', 'Commission'], ['active', 'Active']],
    numeric: ['commission'],
  },
};

export const DEFAULT_SETTINGS = {
  'Opening Cash Balance': 0,
  'Opening Bank Balance': 0,
  'Opening bKash Balance': 0,
  'Opening Nagad Balance': 0,
  'Steadfast Enabled': 'NO',
  'Steadfast API Key': '',
  'Steadfast Secret Key': '',
  'Steadfast Webhook Token': '',
  'Auto Courier Sync': 'YES',
  'AI Parser Enabled': 'YES',
  'Gemini API Key': '',
  'Gemini Model': 'gemini-2.5-flash',
  'Default Commission': 25,
  'Review Template': 'Assalamu Alaikum {customer_name}! ❤️ আপনার order delivered হয়েছে। আমাদের jersey ও service নিয়ে review দিলে পরবর্তী অর্ডারে পাবেন {discount}% ছাড়! রিভিউ দিন: {group_link}',
  'Review Group Link': '',
  'Discount Percent': 10,
  'Rider Alert Template': 'প্রিয় {customer_name}, কুরিয়ার রাইডার আপনার ঠিকানায় গিয়ে জানিয়েছেন: "{rider_note}"। রাইডারের নম্বর: {rider_phone}। আপনি কি আজ পার্সেলটি রিসিভ করতে পারবেন? দয়া করে জানাবেন।',
  'Rider Issue Template': 'Customer {customer_name}-এর order নিয়ে issue: {rider_note}. Rider: {rider_name}, Phone: {rider_phone}.',
  'Promo Template': 'Hi {customer_name}! NIQUE SPORTS থেকে আপনার জন্য special offer 🎉 পরবর্তী যেকোনো অর্ডারে পাবেন {discount}% ছাড়!',
};

export function colLetter(index) {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export const lastCol = (tabKey) => colLetter(TAB_DEFS[tabKey].cols.length - 1);
export const colOf = (tabKey, key) => colLetter(TAB_DEFS[tabKey].cols.findIndex((c) => c[0] === key));

export function rowToObj(tabKey, row = [], rowNumber) {
  const def = TAB_DEFS[tabKey];
  const obj = {};
  def.cols.forEach(([key], i) => {
    const v = row[i];
    if (def.numeric.includes(key)) {
      const n = Number(v);
      obj[key] = Number.isFinite(n) ? n : 0;
    } else {
      obj[key] = v === undefined || v === null ? '' : String(v);
    }
  });
  if (rowNumber) obj._row = rowNumber;
  return obj;
}

export function valueForCell(tabKey, key, value) {
  const def = TAB_DEFS[tabKey];
  if (def.numeric.includes(key)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return value === undefined || value === null ? '' : String(value);
}

export function objToRow(tabKey, obj) {
  return TAB_DEFS[tabKey].cols.map(([key]) => valueForCell(tabKey, key, obj[key]));
}
