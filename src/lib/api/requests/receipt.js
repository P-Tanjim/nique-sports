'use server';

import { headers } from 'next/headers';
import { db } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { getDeliveryLabel } from '@/lib/checkout/pricing';

export async function getReceipt(rawOrderNo) {
  try {
    // 1. VALIDATE (no database yet)
    if (typeof rawOrderNo !== 'string' || rawOrderNo.length > 40) {
      return { success: false, code: 'invalid' };
    }
    const orderNo = rawOrderNo.trim().toUpperCase();
    if (!/^NS-\d{6}-[A-F0-9]{6}$/.test(orderNo)) {
      return { success: false, code: 'invalid' };
    }

    // 2. RATE LIMIT
    const h = await headers();
    const forwardedFor = h.get('x-forwarded-for');
    const firstIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '';
    const ip = firstIp || 'unknown';
    const allowed = rateLimit(`receipt:${ip}`, 30, 60_000);
    if (!allowed) {
      return { success: false, code: 'rate_limited' };
    }

    // 3. LOOKUP with whitelist projection
    const projection = {
      _id: 0,
      orderNo: 1,
      createdAt: 1,
      status: 1,
      customerName: 1,
      deliveryArea: 1,
      items: 1,
      subtotal: 1,
      deliveryFee: 1,
      total: 1,
      advance: 1,
      cod: 1,
    };
    const order = await db.collection('orders').findOne({ orderNo }, { projection });

    // 4. NOT FOUND
    if (!order) {
      return { success: false, code: 'not_found' };
    }

    // 5. MAP to exact shape
    let createdAt = '';
    try {
      createdAt = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();
      if (createdAt === 'Invalid Date' || Number.isNaN(new Date(createdAt).getTime())) {
        createdAt = new Date().toISOString();
      }
    } catch {
      createdAt = new Date().toISOString();
    }

    const rawStatus = typeof order.status === 'string' ? order.status.trim() : '';
    const normalizedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
    const validStatuses = ['Pending', 'Delivered', 'Cancelled', 'Returned'];
    const status = validStatuses.includes(normalizedStatus) ? normalizedStatus : 'Pending';

    const rawName = typeof order.customerName === 'string' ? order.customerName.trim() : '';
    const firstWord = rawName.split(/\s+/)[0] || '';
    const firstName = firstWord.slice(0, 20);

    const deliveryLabel = getDeliveryLabel(order.deliveryArea);

    const rawItems = Array.isArray(order.items) ? order.items.slice(0, 50) : [];
    const items = rawItems.map((it) => {
      const title = typeof it?.title === 'string' ? it.title.slice(0, 150) : '';
      const size = typeof it?.size === 'string' ? it.size.slice(0, 12) : '';
      const rawQty = Math.floor(Number(it?.quantity)) || 1;
      const quantity = Math.min(999, Math.max(1, rawQty));

      const unitPriceNum = Number(it?.unitPrice);
      const unitPrice =
        it?.unitPrice !== undefined && it?.unitPrice !== null && it?.unitPrice !== '' && Number.isFinite(unitPriceNum)
          ? unitPriceNum
          : null;

      const lineTotalNum = Number(it?.lineTotal);
      const lineTotal =
        it?.lineTotal !== undefined && it?.lineTotal !== null && it?.lineTotal !== '' && Number.isFinite(lineTotalNum)
          ? lineTotalNum
          : null;

      const rawCustName = it?.customization?.name ?? it?.custName ?? it?.customName ?? '';
      const custName = typeof rawCustName === 'string' ? rawCustName.slice(0, 14) : '';

      const rawCustNumber = it?.customization?.number ?? it?.custNumber ?? it?.customNumber ?? '';
      const custNumber =
        typeof rawCustNumber === 'string' || typeof rawCustNumber === 'number'
          ? String(rawCustNumber).slice(0, 2)
          : '';

      const patchCount = Array.isArray(it?.patches)
        ? it.patches.length
        : Array.isArray(it?.patch)
          ? it.patch.length
          : Number(it?.patchCount) || 0;

      const hasFont = Boolean(it?.font || it?.fontImage || it?.hasFont);

      return {
        title,
        size,
        quantity,
        unitPrice,
        lineTotal,
        custName,
        custNumber,
        patchCount,
        hasFont,
      };
    });

    const subtotal = Number(order.subtotal) || 0;
    const deliveryFee = Number(order.deliveryFee) || 0;
    const total = Number(order.total) || 0;
    const advance = Number(order.advance) || 0;
    const cod = Number(order.cod) || 0;

    return {
      success: true,
      data: {
        orderNo,
        createdAt,
        status,
        firstName,
        deliveryLabel,
        items,
        subtotal,
        deliveryFee,
        total,
        advance,
        cod,
      },
    };
  } catch (err) {
    console.error('receipt lookup failed:', err?.message);
    return { success: false, code: 'error' };
  }
}

