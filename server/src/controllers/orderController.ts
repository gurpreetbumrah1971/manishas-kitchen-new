import { Request, Response } from 'express';
import prisma from '../prisma';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      mobileNumber,
      whatsappNumber,
      email,
      address,
      tableNumber,
      orderType,
      paymentMethod,
      items, // Array of { foodItemId, quantity }
      totalAmount,
      gstAmount,
      discountAmount,
      grandTotal
    } = req.body;

    const orderNumber = `ORD-${Date.now()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        mobileNumber,
        whatsappNumber,
        email,
        address,
        tableNumber,
        orderType,
        paymentMethod,
        totalAmount,
        gstAmount,
        discountAmount,
        grandTotal,
        orderItems: {
          create: items.map((item: any) => ({
            foodItemId: item.foodItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal
          }))
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
    if (error.code === 'P2003') {
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
