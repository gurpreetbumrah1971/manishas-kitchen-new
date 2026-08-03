import { Request, Response } from 'express';
import { randomInt } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OTP_MINUTES = 10;
const CUSTOMER_TOKEN_DAYS = 30;

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
    const code = process.env.OTP_TEST_CODE || String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);

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

    const otp = await prisma.customerOtp.findFirst({
      where: {
        mobileNumber,
        code,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    const customer = await prisma.customer.upsert({
      where: { mobileNumber },
      update: {},
      create: { mobileNumber },
    });

    await prisma.customerOtp.update({
      where: { id: otp.id },
      data: {
        consumedAt: new Date(),
        customerId: customer.id,
      },
    });

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
