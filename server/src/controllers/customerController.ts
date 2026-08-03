import { Request, Response } from 'express';
import { randomInt } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OTP_MINUTES = 10;
const CUSTOMER_TOKEN_DAYS = 30;

const twilioConfig = () => ({
  enabled: process.env.OTP_PROVIDER === 'twilio',
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || '',
});

const twilioRequest = async (endpoint: string, mobileNumber: string, code?: string) => {
  const config = twilioConfig();
  if (!config.accountSid || !config.authToken || !config.verifyServiceSid) {
    throw new Error('Twilio OTP is enabled but its credentials are incomplete');
  }

  const body = new URLSearchParams({ To: `+${mobileNumber}` });
  if (code) body.set('Code', code);
  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${config.verifyServiceSid}/${endpoint}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    },
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || 'Twilio OTP request failed');
  return result;
};

const normalizeMobileNumber = (value: string) => {
  const digits = String(value || '').replace(/\D+/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const publicCustomerWallet = async (customerId: number) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      cashbackTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          order: {
            select: {
              orderNumber: true,
              grandTotal: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!customer) return null;

  return {
    customer: {
      id: customer.id,
      mobileNumber: customer.mobileNumber,
      name: customer.name,
      cashbackBalance: Number(customer.cashbackBalance),
    },
    transactions: customer.cashbackTransactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      balanceAfter: Number(transaction.balanceAfter),
      note: transaction.note,
      createdAt: transaction.createdAt,
      order: transaction.order
        ? {
          orderNumber: transaction.order.orderNumber,
          grandTotal: Number(transaction.order.grandTotal),
          createdAt: transaction.order.createdAt,
        }
        : null,
    })),
  };
};

const publicCustomerOrders = async (customerId: number) => {
  const orders = await prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      orderNumber: true,
      customerName: true,
      grandTotal: true,
      cashbackEarned: true,
      cashbackRedeemed: true,
      paymentMethod: true,
      status: true,
      orderType: true,
      createdAt: true,
      orderItems: {
        select: { quantity: true, foodItem: { select: { name: true } } },
      },
    },
  });

  return orders.map((order) => ({
    ...order,
    grandTotal: Number(order.grandTotal),
    cashbackEarned: Number(order.cashbackEarned),
    cashbackRedeemed: Number(order.cashbackRedeemed),
    items: order.orderItems.map((item) => ({ name: item.foodItem.name, quantity: item.quantity })),
    orderItems: undefined,
  }));
};

export const requestCustomerOtp = async (req: Request, res: Response) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.mobileNumber);
    const name = String(req.body.name || '').trim();

    if (mobileNumber.length < 10) {
      return res.status(400).json({ error: 'A valid mobile number is required' });
    }

    const customer = await prisma.customer.upsert({
      where: { mobileNumber },
      update: name ? { name } : {},
      create: { mobileNumber, name: name || undefined },
    });
    const expiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);

    if (twilioConfig().enabled) {
      await twilioRequest('Verifications', mobileNumber, undefined).then(() => undefined);
      return res.status(201).json({
        ok: true,
        mobileNumber,
        expiresAt,
        provider: 'twilio',
        message: 'OTP sent by SMS.',
      });
    }

    const code = process.env.OTP_TEST_CODE || String(randomInt(100000, 1000000));

    await prisma.customerOtp.create({
      data: {
        mobileNumber,
        code,
        expiresAt,
        customerId: customer.id,
      },
    });

    res.status(201).json({
      ok: true,
      mobileNumber,
      expiresAt,
      testOtp: code,
      message: 'Testing OTP generated. Use this code to verify login.',
    });
  } catch (error) {
    console.error('Customer OTP request error:', error);
    res.status(500).json({ error: 'Could not generate OTP' });
  }
};

export const verifyCustomerOtp = async (req: Request, res: Response) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.mobileNumber);
    const code = String(req.body.otp || req.body.code || '').trim();

    if (!mobileNumber || !code) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }

    let otp: { id: number } | null = null;
    if (twilioConfig().enabled) {
      const verification = await twilioRequest('VerificationCheck', mobileNumber, code);
      if (verification.status !== 'approved') return res.status(401).json({ error: 'Invalid or expired OTP' });
    } else {
      otp = await prisma.customerOtp.findFirst({
        where: {
          mobileNumber,
          code,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otp) return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    const customer = await prisma.customer.upsert({
      where: { mobileNumber },
      update: {},
      create: { mobileNumber },
    });

    if (otp) {
      await prisma.customerOtp.update({
        where: { id: otp.id },
        data: {
          consumedAt: new Date(),
          customerId: customer.id,
        },
      });
    }

    const expiresAt = new Date(Date.now() + CUSTOMER_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    const token = jwt.sign(
      { type: 'customer', id: customer.id, mobileNumber: customer.mobileNumber },
      JWT_SECRET,
      { expiresIn: `${CUSTOMER_TOKEN_DAYS}d` },
    );
    const wallet = await publicCustomerWallet(customer.id);

    res.json({
      token,
      expiresAt,
      ...wallet,
    });
  } catch (error) {
    console.error('Customer OTP verification error:', error);
    res.status(500).json({ error: 'Could not verify OTP' });
  }
};

export const getCustomerWallet = async (req: Request, res: Response) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ error: 'Customer login required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'customer' || !decoded.id) {
      return res.status(401).json({ error: 'Invalid customer token' });
    }

    const wallet = await publicCustomerWallet(Number(decoded.id));
    if (!wallet) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(wallet);
  } catch (error) {
    res.status(401).json({ error: 'Invalid customer token' });
  }
};

export const getCustomerAccount = async (req: Request, res: Response) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Customer login required' });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'customer' || !decoded.id) return res.status(401).json({ error: 'Invalid customer token' });

    const wallet = await publicCustomerWallet(Number(decoded.id));
    if (!wallet) return res.status(404).json({ error: 'Customer not found' });

    res.json({ ...wallet, orders: await publicCustomerOrders(Number(decoded.id)) });
  } catch (error) {
    res.status(401).json({ error: 'Invalid customer token' });
  }
};
