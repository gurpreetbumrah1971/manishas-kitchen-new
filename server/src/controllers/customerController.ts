import { Request, Response } from 'express';
import { randomInt } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { ensureCustomerReferralCode, normalizeReferralCode } from '../utils/referral';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OTP_MINUTES = 10;
const CUSTOMER_TOKEN_DAYS = 30;
const REFERRAL_DISCOUNT_RATE = 0.05;

const twilioConfig = () => ({
  enabled: process.env.OTP_PROVIDER === 'twilio',
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || '',
});

const msg91Config = () => ({
  enabled: process.env.OTP_PROVIDER === 'msg91',
  // Reuse the WhatsApp key when a separate OTP key is not configured in Render.
  authKey: process.env.MSG91_AUTHKEY || process.env.MSG91_WHATSAPP_AUTHKEY || '',
  widgetId: process.env.MSG91_WIDGET_ID || '',
});

const verifyMsg91Otp = async (otp: string, requestId: string) => {
  const { authKey, widgetId } = msg91Config();
  if (!authKey || !widgetId) throw new Error('MSG91 auth key or widget ID is not configured');
  if (!requestId) throw new Error('MSG91 OTP session is missing. Please request a new OTP.');

  const response = await fetch('https://api.msg91.com/api/v5/widget/verifyOtp', {
    method: 'POST',
    headers: { authkey: authKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ widgetId, reqId: requestId, otp }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || 'MSG91 OTP verification failed');

  const verified = result.success === true
    || String(result.type || result.status || '').toLowerCase() === 'success';
  if (!verified) throw new Error(result.message || 'MSG91 could not verify this OTP');
  return result;
};

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

const customerIdFromToken = (authorization: string) => {
  const token = String(authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  return decoded.type === 'customer' && decoded.id ? Number(decoded.id) : null;
};

const publicCustomerWallet = async (customerId: number) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      savedAddresses: {
        orderBy: { updatedAt: 'desc' },
      },
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
      birthday: customer.birthday,
      anniversary: customer.anniversary,
      referralCode: customer.referralCode,
      cashbackBalance: Number(customer.cashbackBalance),
      savedAddresses: customer.savedAddresses.map((savedAddress) => ({
        id: savedAddress.id,
        label: savedAddress.label,
        address: savedAddress.address,
      })),
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
    const intent = String(req.body.intent || '').trim().toLowerCase();

    if (mobileNumber.length < 10) {
      return res.status(400).json({ error: 'A valid mobile number is required' });
    }

    let customer;
    if (intent === 'existing') {
      customer = await prisma.customer.findUnique({ where: { mobileNumber } });
      if (!customer) {
        return res.status(404).json({
          error: 'This mobile number is not registered yet. Please continue as a New User.',
          notRegistered: true,
        });
      }
    } else {
      customer = await prisma.customer.upsert({
        where: { mobileNumber },
        update: name ? { name } : {},
        create: { mobileNumber, name: name || undefined },
      });
    }
    await ensureCustomerReferralCode(prisma, customer);
    const expiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);

    if (msg91Config().enabled) {
      return res.status(201).json({
        ok: true,
        mobileNumber,
        expiresAt,
        provider: 'msg91',
        message: 'Ready to send OTP through MSG91.',
      });
    }

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
    const msg91RequestId = String(req.body.msg91RequestId || '').trim();

    if (!mobileNumber || !code) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }

    let otp: { id: number } | null = null;
    if (msg91Config().enabled) {
      await verifyMsg91Otp(code, msg91RequestId);
    } else if (twilioConfig().enabled) {
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
    await ensureCustomerReferralCode(prisma, customer);

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
    const message = error instanceof Error ? error.message : 'Could not verify OTP';
    res.status(/invalid|expired|session/i.test(message) ? 401 : 500).json({ error: message });
  }
};

export const validateReferral = async (req: Request, res: Response) => {
  try {
    const code = normalizeReferralCode(req.body.code);
    const mobileNumber = normalizeMobileNumber(String(req.body.mobileNumber || ''));

    if (!code) {
      return res.status(400).json({ error: 'Referral code is required' });
    }

    const referrer = await prisma.customer.findUnique({ where: { referralCode: code } });
    if (!referrer) {
      return res.json({ valid: false, message: 'Invalid referral code. Please check and try again.' });
    }

    let selfReferral = false;
    let priorOrders = 0;
    if (mobileNumber) {
      const selfCustomer = await prisma.customer.findUnique({ where: { mobileNumber } });
      if (selfCustomer) {
        if (selfCustomer.id === referrer.id) selfReferral = true;
        priorOrders = await prisma.order.count({ where: { customerId: selfCustomer.id } });
      }
    }

    if (selfReferral) {
      return res.json({ valid: false, message: 'You cannot use your own referral code.' });
    }
    if (priorOrders > 0) {
      return res.json({ valid: false, message: 'Referral discount applies only to your first order.' });
    }

    res.json({
      valid: true,
      discountPercent: Math.round(REFERRAL_DISCOUNT_RATE * 100),
      referrerName: referrer.name || null,
      message: referrer.name
        ? `Referral accepted! 5% off from ${referrer.name}.`
        : 'Referral accepted! You get 5% off on this order.',
    });
  } catch (error) {
    console.error('Referral validation error:', error);
    res.status(500).json({ error: 'Could not validate referral code' });
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

export const saveCustomerAddress = async (req: Request, res: Response) => {
  try {
    const customerId = customerIdFromToken(String(req.headers.authorization || ''));
    if (!customerId) return res.status(401).json({ error: 'Please login to save an address.' });

    const label = String(req.body.label || '').trim().slice(0, 40);
    const address = String(req.body.address || '').trim().slice(0, 1000);
    if (!label || !address) return res.status(400).json({ error: 'An address title and address are required.' });

    const existing = await prisma.customerAddress.findFirst({ where: { customerId, label } });
    if (existing) {
      await prisma.customerAddress.update({ where: { id: existing.id }, data: { address } });
    } else {
      await prisma.customerAddress.create({ data: { customerId, label, address } });
    }

    const wallet = await publicCustomerWallet(customerId);
    res.status(201).json(wallet);
  } catch (error) {
    console.error('Save customer address error:', error);
    res.status(401).json({ error: 'Could not save the address.' });
  }
};

export const deleteCustomerAddress = async (req: Request, res: Response) => {
  try {
    const customerId = customerIdFromToken(String(req.headers.authorization || ''));
    const addressId = Number(req.params.id);
    if (!customerId) return res.status(401).json({ error: 'Customer login required' });
    if (!Number.isInteger(addressId)) return res.status(400).json({ error: 'Invalid address' });

    await prisma.customerAddress.deleteMany({ where: { id: addressId, customerId } });
    const wallet = await publicCustomerWallet(customerId);
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ error: 'Could not remove the address.' });
  }
};

export const updateCustomerProfile = async (req: Request, res: Response) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    let customerId: number | null = null;

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.type === 'customer' && decoded.id) customerId = Number(decoded.id);
    }

    if (!customerId && req.body.orderNumber && req.body.orderSessionToken) {
      const order = await prisma.order.findFirst({
        where: {
          orderNumber: String(req.body.orderNumber),
          customerSessionToken: String(req.body.orderSessionToken),
          customerSessionExpiresAt: { gt: new Date() },
        },
      });
      if (order) {
        if (order.customerId) {
          customerId = order.customerId;
        } else {
          const byMobile = await prisma.customer.findUnique({ where: { mobileNumber: order.mobileNumber } });
          customerId = byMobile ? byMobile.id : null;
        }
      }
    }

    if (!customerId) return res.status(401).json({ error: 'Customer login required' });

    const birthday = req.body.birthday ? new Date(String(req.body.birthday)) : null;
    const anniversary = req.body.anniversary ? new Date(String(req.body.anniversary)) : null;

    if (birthday && Number.isNaN(birthday.getTime())) {
      return res.status(400).json({ error: 'Invalid birthday' });
    }
    if (anniversary && Number.isNaN(anniversary.getTime())) {
      return res.status(400).json({ error: 'Invalid anniversary' });
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        birthday,
        anniversary,
      },
    });

    const wallet = await publicCustomerWallet(customerId);
    res.json(wallet);
  } catch (error) {
    console.error('Customer profile update error:', error);
    res.status(401).json({ error: 'Invalid customer token' });
  }
};
