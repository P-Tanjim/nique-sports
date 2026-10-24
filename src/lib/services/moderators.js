import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/auth';
import { appendObjects, patchCells, readObjects } from '@/lib/sheets/client';
import { defaultCommission, toMap } from '@/lib/sheets/settings';
import { isOn } from '@/lib/orders/helpers';
import { UserError } from '@/lib/orders/validate';

// Moderators = users with userRole 'moderator' in MongoDB (you set that by hand).
// Commission/active live in the sheet's "Moderators" tab (managed from Settings).
export const listModerators = cache(async () => {
  const [users, sheet] = await Promise.all([
    db.collection('user').find({ userRole: 'moderator' }, { projection: { name: 1, email: 1 } }).toArray(),
    readObjects(['moderators', 'settings']),
  ]);
  const fallback = defaultCommission(toMap(sheet.settings));
  const cfg = new Map(sheet.moderators.map((m) => [m.id, m]));
  return users.map((u) => {
    const id = String(u._id);
    const c = cfg.get(id);
    return {
      id,
      name: u.name || u.email || 'Moderator',
      email: u.email ?? '',
      commission: c ? Number(c.commission) : fallback,
      active: c ? isOn(c.active) : true,
    };
  });
});

export async function saveModerator(id, name, { commission, active }) {
  const { moderators } = await readObjects(['moderators']);
  const row = moderators.find((m) => m.id === id)?._row;
  const patch = { name, commission, active: active ? 'TRUE' : 'FALSE' };
  if (row) await patchCells([{ tabKey: 'moderators', row, patch }]);
  else await appendObjects('moderators', [{ id, ...patch }]);
}

// Accounts the user may attribute a manual order to ("By whom")
export async function listAssignees(user) {
  if (user.userRole !== 'admin') return [{ value: user.id, label: user.name }];
  const mods = (await listModerators()).filter((m) => m.active);
  return [{ value: user.id, label: `${user.name} (me)` }, ...mods.map((m) => ({ value: m.id, label: m.name }))];
}

export async function resolveAssignee(user, requestedId) {
  const mods = await listModerators();
  if (user.userRole === 'moderator') {
    const me = mods.find((m) => m.id === user.id);
    if (me && !me.active) throw new UserError('Your account is disabled. Contact the admin.');
    return { id: user.id, name: user.name, commissionRate: me?.commission ?? 0 };
  }
  if (!requestedId || requestedId === user.id) return { id: user.id, name: user.name, commissionRate: 0 };
  const m = mods.find((x) => x.id === requestedId && x.active);
  if (!m) throw new UserError('Choose a valid account for "By whom".');
  return { id: m.id, name: m.name, commissionRate: m.commission };
}
