import { ACCOUNTS, SOURCES } from './constants';
import { clean, isIsoDate, money, normalizePhone, normalizeSize, todayDhaka } from './helpers';

export class UserError extends Error {}

const fail = (msg) => { throw new UserError(msg); };
const MAX_AMOUNT = 1_000_000;

// Validates + normalises the manual/edit order form. Throws UserError with a friendly message.
export function validateOrderInput(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('Invalid order data.');

  const customerName = clean(raw.customerName);
  if (!customerName || customerName.length > 100) fail('Enter the customer name (max 100 characters).');

  const phone = normalizePhone(raw.phone);
  if (!phone) fail('Enter a valid 11-digit phone number, e.g. 01812345678.');
  const phone2Raw = clean(raw.phone2);
  const phone2 = phone2Raw ? normalizePhone(phone2Raw) : '';
  if (phone2Raw && !phone2) fail('The second phone number is not valid.');

  const address = clean(raw.address);
  if (address.length < 5 || address.length > 500) fail('Enter the full delivery address (5-500 characters).');

  if (!Array.isArray(raw.items) || raw.items.length < 1 || raw.items.length > 20) fail('Add between 1 and 20 items.');
  const items = raw.items.map((it, i) => {
    const title = clean(it?.title);
    if (!title || title.length > 150) fail(`Item ${i + 1}: enter the product name.`);
    const quantity = Number(it?.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) fail(`Item ${i + 1}: quantity must be 1-50.`);
    const size = clean(it?.size) ? normalizeSize(it.size) : '';
    if (clean(it?.size) && !size) fail(`Item ${i + 1}: size is not valid.`);
    const note = clean(it?.note);
    if (note.length > 150) fail(`Item ${i + 1}: note is too long.`);
    return { title, size, quantity, note };
  });

  const cod = money(raw.cod);
  const advance = money(raw.advance);
  if (cod < 0 || advance < 0 || cod > MAX_AMOUNT || advance > MAX_AMOUNT) fail('Amounts must be between 0 and 1,000,000.');
  if (cod + advance <= 0) fail('Enter the COD amount or an advance.');

  const advanceAccount = advance > 0 ? clean(raw.advanceAccount) : '';
  if (advance > 0 && !ACCOUNTS.includes(advanceAccount)) fail('Choose where the advance was received.');

  const note = clean(raw.note);
  if (note.length > 1000) fail('Note is too long (max 1000).');

  const source = SOURCES.includes(raw.source) ? raw.source : 'Facebook';

  const date = clean(raw.date) || todayDhaka();
  if (!isIsoDate(date) || date > todayDhaka()) fail('Pick a valid date (not in the future).');

  return {
    customerName, phone, phone2, address, items, cod, advance, advanceAccount, note, source, date,
    assigneeId: clean(raw.assigneeId),
    sendToCourier: raw.sendToCourier !== false,
  };
}
