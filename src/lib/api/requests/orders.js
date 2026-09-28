// →  src/lib/api/requests/orders.js
'use server';

import { serverPost } from '@/lib/api/core/core';

export async function submitOrder(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const request = {
    customer: {
      name: payload?.customer?.name,
      address: payload?.customer?.address,
      phone: payload?.customer?.phone,
      phone2: payload?.customer?.phone2 ?? '',
      note: payload?.customer?.note ?? '',
    },
    deliveryArea: payload?.deliveryArea,
    items: items.map((item) => ({
      productId: String(item?.id ?? item?._id ?? ''),
      quantity: item?.quantity,
      size: item?.size,
      customization: {
        name: item?.customization?.name ?? '',
        number: item?.customization?.number ?? '',
        fontImage: typeof item?.customization?.font === 'string'
          ? item.customization.font
          : item?.customization?.font?.image ?? '',
      },
      patches: (Array.isArray(item?.patch) ? item.patch : item?.patch ? [item.patch] : [])
        .map((patch) => typeof patch === 'string' ? patch : patch?.image)
        .filter(Boolean),
    })),
  };

  const result = await serverPost('/orders', request);
  if (!result?.success) return result ?? { success: false, error: 'Could not save your order. Please try again.' };
  if (typeof result.data?.orderId !== 'string' || !result.data.orderId) {
    return { success: false, error: 'The order service returned an invalid response.' };
  }

  return { success: true, orderId: result.data.orderId, status: result.data.status };
}