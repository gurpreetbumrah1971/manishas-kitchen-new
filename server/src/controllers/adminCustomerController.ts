import { Request, Response } from 'express';
import prisma from '../prisma';

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const customerSelect = {
  id: true,
  mobileNumber: true,
  name: true,
  birthday: true,
  anniversary: true,
  referralCode: true,
  cashbackBalance: true,
  createdAt: true,
  updatedAt: true,
  orders: {
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      orderNumber: true,
      orderType: true,
      status: true,
      grandTotal: true,
      createdAt: true,
    },
  },
};

const publicCustomer = (customer: any) => {
  const orders = customer.orders.map((order: any) => ({ ...order, grandTotal: Number(order.grandTotal) }));
  const orderDates = orders.map((order: any) => new Date(order.createdAt).getTime());
  return {
    ...customer,
    number: customer.mobileNumber,
    cashbackBalance: Number(customer.cashbackBalance),
    orders,
    totalSpent: money(orders.reduce((total: number, order: any) => total + order.grandTotal, 0)),
    firstOrderAt: orderDates.length ? new Date(Math.min(...orderDates)).toISOString() : null,
    latestOrderAt: orderDates.length ? new Date(Math.max(...orderDates)).toISOString() : null,
  };
};

const customerData = (body: any) => {
  const mobileNumber = String(body.mobileNumber || '').replace(/\D/g, '');
  const name = String(body.name || '').trim();
  const birthday = body.birthday ? new Date(body.birthday) : null;
  const anniversary = body.anniversary ? new Date(body.anniversary) : null;

  if (mobileNumber.length < 10) throw new Error('Enter a valid mobile number.');
  if (birthday && Number.isNaN(birthday.getTime())) throw new Error('Enter a valid birthday.');
  if (anniversary && Number.isNaN(anniversary.getTime())) throw new Error('Enter a valid anniversary date.');

  return { mobileNumber, name: name || null, birthday, anniversary };
};

export const getAdminCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { updatedAt: 'desc' },
      select: customerSelect,
    });
    res.json(customers.map(publicCustomer));
  } catch (error) {
    console.error('Get admin customers error:', error);
    res.status(500).json({ error: 'Could not load customers.' });
  }
};

export const createAdminCustomer = async (req: Request, res: Response) => {
  try {
    const data = customerData(req.body);
    const customer = await prisma.customer.upsert({
      where: { mobileNumber: data.mobileNumber },
      create: data,
      update: data,
      select: customerSelect,
    });
    res.status(201).json(publicCustomer(customer));
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Could not save customer.' });
  }
};

export const updateAdminCustomer = async (req: Request, res: Response) => {
  try {
    const customerId = Number(req.params.id);
    if (!Number.isInteger(customerId) || customerId < 1) return res.status(400).json({ error: 'Invalid customer.' });

    const data = customerData(req.body);
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data,
      select: customerSelect,
    });
    res.json(publicCustomer(customer));
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Customer not found.' });
    if (error?.code === 'P2002') return res.status(400).json({ error: 'That mobile number is already in use.' });
    res.status(400).json({ error: error?.message || 'Could not update customer.' });
  }
};

export const creditAdminCashback = async (req: Request, res: Response) => {
  try {
    const customerId = Number(req.params.id);
    const amount = money(Number(req.body.amount));
    const note = String(req.body.note || '').trim();
    if (!Number.isInteger(customerId) || customerId < 1) return res.status(400).json({ error: 'Invalid customer.' });
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Enter a cashback amount greater than zero.' });

    const customer = await prisma.$transaction(async (tx) => {
      const existing = await tx.customer.findUnique({ where: { id: customerId }, select: { cashbackBalance: true } });
      if (!existing) throw new Error('CUSTOMER_NOT_FOUND');
      const cashbackBalance = money(Number(existing.cashbackBalance) + amount);
      await tx.cashbackTransaction.create({
        data: {
          customerId,
          type: 'ADJUSTED',
          amount,
          balanceAfter: cashbackBalance,
          note: note || 'Cashback credited by admin',
        },
      });
      return tx.customer.update({ where: { id: customerId }, data: { cashbackBalance }, select: customerSelect });
    });
    res.json(publicCustomer(customer));
  } catch (error: any) {
    if (error?.message === 'CUSTOMER_NOT_FOUND') return res.status(404).json({ error: 'Customer not found.' });
    res.status(400).json({ error: error?.message || 'Could not credit cashback.' });
  }
};
