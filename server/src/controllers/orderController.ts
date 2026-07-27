import { Request, Response } from 'express';
import prisma from '../prisma';

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
        orderItems: {
          create: orderItems
        }
      },
      include: {
        orderItems: {
          include: { foodItem: true }
        }
      }
    });

    // TODO: Send WhatsApp notification
    
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
      include: {
        orderItems: {
          include: { foodItem: true }
        }
      },
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
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
