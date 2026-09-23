// lib/demo/dashboardDemoData.js
//
// Placeholder data so the dashboard has something to render before
// the Express endpoints in lib/api/requests/dashboard.js are wired
// up. dashboard/page.jsx automatically falls back to this whenever a
// real fetch returns null/empty — delete this file once every
// endpoint is live and returning real data.

export const DEMO_STATS = {
  revenue: { value: '৳2,84,500', change: '+12.4%', trend: 'positive' },
  orders: { value: '342', change: '+8.2%', trend: 'positive' },
  customers: { value: '156', change: '+4.6%', trend: 'positive' },
  pendingOrders: { value: '18', change: '-2 today', trend: 'positive' },
};

export const DEMO_REVENUE = [
  { date: 'Mon', revenue: 8400 },
  { date: 'Tue', revenue: 11200 },
  { date: 'Wed', revenue: 9800 },
  { date: 'Thu', revenue: 14300 },
  { date: 'Fri', revenue: 12100 },
  { date: 'Sat', revenue: 16800 },
  { date: 'Sun', revenue: 15200 },
];

export const DEMO_ORDERS = [
  { id: '#NS-1042', customer: 'Rakibul Hasan', amount: 2450, status: 'delivered', date: 'Today, 2:34 PM', items: 2 },
  { id: '#NS-1041', customer: 'Farhana Akter', amount: 1150, status: 'processing', date: 'Today, 1:10 PM', items: 1 },
  { id: '#NS-1040', customer: 'Imran Kabir', amount: 3600, status: 'pending', date: 'Today, 11:47 AM', items: 3 },
  { id: '#NS-1039', customer: 'Sadia Islam', amount: 1090, status: 'shipped', date: 'Yesterday, 6:22 PM', items: 1 },
  { id: '#NS-1038', customer: 'Tanvir Ahmed', amount: 2180, status: 'cancelled', date: 'Yesterday, 3:15 PM', items: 2 },
  { id: '#NS-1037', customer: 'Nusrat Jahan', amount: 1450, status: 'delivered', date: 'Yesterday, 12:05 PM', items: 1 },
];

export const DEMO_TOP_PRODUCTS = [
  { id: 1, name: 'BD Premium Home Jersey 26/27', category: 'BD Premium', sold: 86, revenue: 90300 },
  { id: 2, name: 'Home Replica — Player Edition 26/27', category: 'Player Edition Replica', sold: 64, revenue: 70400 },
  { id: 3, name: 'Away Player Edition 26/27', category: 'Player Edition', sold: 52, revenue: 58240 },
  { id: 4, name: '90s Retro Home Jersey 26/27', category: 'Manufactured Retro', sold: 41, revenue: 43050 },
  { id: 5, name: 'Goalkeeper Player Edition 26/27', category: 'Player Edition', sold: 33, revenue: 36630 },
];

export const DEMO_LOW_STOCK = [
  { id: 1, name: 'BD Premium Away Jersey 26/27', stock: 3 },
  { id: 2, name: 'Anthem Replica Jacket 26/27', stock: 5 },
  { id: 3, name: 'Training Jersey — Player Edition 26/27', stock: 2 },
];