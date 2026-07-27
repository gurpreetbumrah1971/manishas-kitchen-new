import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import prisma from '../prisma';
import { sendAdminOrderWhatsApp } from '../services/whatsappService';

const ORDER_SESSION_MINUTES = 30;

const orderInclude = {
  orderItems: {
    include: { foodItem: true }
  }
};

const orderSessionExpiry = () => new Date(Date.now() + ORDER_SESSION_MINUTES * 60 * 1000);

const publicStatusLabel = (order: any) => {
  if (order.status === 'DELIVERED') return 'DELIVERED';
  if (order.status === 'COMPLETED') return 'READY';
  if (order.status === 'PREPARING') return 'PREPARING';
  if (order.confirmedAt) return 'CONFIRMED';
  return 'PENDING';
};

const publicOrderStatus = (order: any) => {
  const preparationEndsAt = order.preparationStartedAt && order.preparationMinutes
    ? new Date(new Date(order.preparationStartedAt).getTime() + Number(order.preparationMinutes) * 60 * 1000)
    : null;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: publicStatusLabel(order),
    confirmedAt: order.confirmedAt,
    preparationStartedAt: order.preparationStartedAt,
    preparationMinutes: order.preparationMinutes,
    preparationEndsAt,
    readyAt: order.readyAt,
    deliveredAt: order.deliveredAt,
    grandTotal: order.grandTotal,
    paymentMethod: order.paymentMethod,
    customerSessionExpiresAt: order.customerSessionExpiresAt,
  };
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      mobileNumber,
      whatsappNumber,
      birthday,
      anniversary,
      email,
      address,
      tableNumber,
      orderType,
      paymentMethod,
      items, // Array of { foodItemId, name, quantity, unitPrice, subtotal }
      totalAmount,
      gstAmount,
      discountAmount,
      grandTotal
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    const requestedIds = items
      .map((item: any) => Number(item.foodItemId))
      .filter((id: number) => Number.isInteger(id) && id > 0);
    const requestedNames = items
      .map((item: any) => String(item.name || '').trim())
      .filter(Boolean);
    if (!requestedIds.length && !requestedNames.length) {
      return res.status(400).json({ error: 'Valid order items are required' });
    }
    const itemLookupFilters = [
      requestedIds.length ? { id: { in: requestedIds } } : null,
      requestedNames.length ? { name: { in: requestedNames } } : null,
    ].filter(Boolean);
    const foodItems = await prisma.foodItem.findMany({
      where: {
        OR: itemLookupFilters as any,
      },
    });
    const foodItemsById = new Map(foodItems.map((item) => [item.id, item]));
    const foodItemsByName = new Map(foodItems.map((item) => [item.name.toLowerCase(), item]));
    const orderItems = items.map((item: any) => {
      const foodItemId = Number(item.foodItemId);
      const name = String(item.name || '').trim().toLowerCase();
      const foodItem = foodItemsByName.get(name) || foodItemsById.get(foodItemId);
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(item.unitPrice);
      const subtotal = Number(item.subtotal);

      if (!foodItem) {
        throw Object.assign(new Error(`Invalid food item: ${item.name || foodItemId}`), { code: 'INVALID_FOOD_ITEM' });
      }

      return {
        foodItemId: foodItem.id,
        quantity,
        unitPrice: Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : Number(foodItem.price),
        subtotal: Number.isFinite(subtotal) && subtotal > 0 ? subtotal : Number(foodItem.price) * quantity,
      };
    });
    const orderNumber = `ORD-${Date.now()}`;
    const customerSessionToken = randomBytes(24).toString('hex');

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        mobileNumber,
        whatsappNumber,
        birthday: birthday ? new Date(birthday) : undefined,
        anniversary: anniversary ? new Date(anniversary) : undefined,
        email,
        address,
        tableNumber,
        orderType: orderType || 'DINE_IN',
        paymentMethod: paymentMethod || 'UPI',
        totalAmount: Number(totalAmount) || orderItems.reduce((sum, item) => sum + item.subtotal, 0),
        gstAmount: Number(gstAmount) || 0,
        discountAmount: Number(discountAmount) || 0,
        grandTotal: Number(grandTotal) || orderItems.reduce((sum, item) => sum + item.subtotal, 0),
        customerSessionToken,
        customerSessionExpiresAt: orderSessionExpiry(),
        orderItems: {
          create: orderItems
        }
      },
      include: orderInclude
    });

    sendAdminOrderWhatsApp(order).catch((error) => {
      console.error('WhatsApp admin notification error:', error);
    });

    res.status(201).json(order);
  } catch (error: any) {
    console.error('Order creation error:', error);
    if (error.code === 'P2003' || error.code === 'INVALID_FOOD_ITEM') {
      return res.status(400).json({ error: 'Invalid food item in cart. Please refresh your menu and try again.' });
    }
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, action, preparationMinutes } = req.body;
    const orderId = Number(id);
    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const now = new Date();
    const requestedAction = String(action || status || '').toUpperCase();
    const data: any = {};

    if (requestedAction === 'CONFIRM' || requestedAction === 'CONFIRMED') {
      data.confirmedAt = existingOrder.confirmedAt || now;
    } else if (requestedAction === 'PREPARING') {
      const minutes = Math.max(1, Math.min(180, Number(preparationMinutes) || 0));
      if (!Number.isFinite(minutes) || minutes < 1) {
        return res.status(400).json({ error: 'Preparation time must be at least 1 minute' });
      }
      data.status = 'PREPARING';
      data.confirmedAt = existingOrder.confirmedAt || now;
      data.preparationStartedAt = now;
      data.preparationMinutes = minutes;
      data.readyAt = null;
      data.deliveredAt = null;
    } else if (requestedAction === 'READY' || requestedAction === 'COMPLETED') {
      data.status = 'COMPLETED';
      data.confirmedAt = existingOrder.confirmedAt || now;
      data.readyAt = now;
    } else if (requestedAction === 'DELIVERED') {
      data.status = 'DELIVERED';
      data.confirmedAt = existingOrder.confirmedAt || now;
      data.deliveredAt = now;
    } else if (requestedAction === 'CANCELLED') {
      data.status = 'CANCELLED';
    } else {
      return res.status(400).json({ error: 'Invalid order action' });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data,
      include: orderInclude
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

export const getOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderNumber = String(req.params.orderNumber || '');
    const token = String(req.query.token || '');

    if (!token) {
      return res.status(401).json({ error: 'Order session token is required' });
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        customerSessionToken: token,
        customerSessionExpiresAt: { gt: new Date() },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order session expired or not found' });
    }

    res.json(publicOrderStatus(order));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
};
