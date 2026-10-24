// Shared by server AND client code. No secrets, no server-only imports here.

export const ACCOUNTS = ['Cash', 'Bank', 'bKash', 'Nagad'];
export const ACCOUNT_KEY = { Cash: 'cash', Bank: 'bank', bKash: 'bkash', Nagad: 'nagad' };

export const ORDER_STATUSES = ['Pending', 'Delivered', 'Cancelled', 'Returned'];
export const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
export const SOURCES = ['Website', 'Facebook', 'Instagram', 'WhatsApp', 'TikTok', 'Phone', 'Other'];

export const DELIVERY_AREAS = [
  { value: '', label: 'Custom / not set', fee: 0 },
  { value: 'inside-dhaka', label: 'Inside Dhaka', fee: 70 },
  { value: 'outside-dhaka', label: 'Outside Dhaka', fee: 120 },
];

// Sheet stores readable labels (same as the old app); the UI uses snake_case.
export const TX_LABEL = {
  money_in: 'Money In',
  expense: 'Expense',
  transfer: 'Transfer',
  moderator_payment: 'Moderator Payment',
};
export const TX_TYPE = Object.fromEntries(Object.entries(TX_LABEL).map(([k, v]) => [v, k]));

// Steadfast statuses that will never change again -> stop polling them.
export const FINAL_COURIER = ['delivered', 'partial_delivered', 'cancelled'];

export const ROLES = { ADMIN: 'admin', MODERATOR: 'moderator' };
