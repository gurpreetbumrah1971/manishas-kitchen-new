import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { sendAdminOrderWhatsApp } from '../services/whatsappService';
import { ensureCustomerReferralCode, normalizeReferralCode } from '../utils/referral';

const ORDER_SESSION_MINUTES = 30;
const CASHBACK_RATE = 0.10;
const REFERRAL_DISCOUNT_RATE = 0.05;
const REFERRAL_REWARD_RATE = 0.05;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const orderInclude = {
  orderItems: {
    include: { foodItem: true }
  }
};

const orderSessionExpiry = () => new Date(Date.now() + ORDER_SESSION_MINUTES * 60 * 1000);

const money = (value: number) => Math.max(0, Math.round(Number(value || 0) * 100) / 100);

const normalizeMobileNumber = (value: string) => {
  const digits = String(value || '').replace(/\D+/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const customerFromToken = (token: string) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'customer' || !decoded.id || !decoded.mobileNumber) return null;
    return {
      id: Number(decoded.id),
      mobileNumber: String(decoded.mobileNumber),
    };
  } catch {
    return null;
  }
};

const deliveryChargeForSubtotal = (subtotal: number) => {
  if (subtotal <= 0 || subtotal > 300) return 0;
  return subtotal < 150 ? 50 : 30;
};

const publicStatusLabel = (order: any) => {
  if (order.status === 'CANCELLED') return 'CANCELLED';
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
    cashbackEarned: order.cashbackEarned,
    cashbackRedeemed: order.cashbackRedeemed,
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
      gstAmount,
      discountAmount,
      cashbackRedeemAmount,
      referralCode,
      customerAuthToken
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
    const computedSubtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const computedDeliveryAmount = deliveryChargeForSubtotal(computedSubtotal);
    const normalizedTotalAmount = computedSubtotal;
    const normalizedGstAmount = Number(gstAmount) || 0;
    const normalizedDiscountAmount = Number(discountAmount) || 0;
    const preCashbackGrandTotal = money(computedSubtotal + normalizedGstAmount - normalizedDiscountAmount + computedDeliveryAmount);
    const requestedCashbackRedeem = money(Number(cashbackRedeemAmount) || 0);
    const normalizedMobileNumber = normalizeMobileNumber(mobileNumber || whatsappNumber || '');
    const authenticatedCustomer = customerFromToken(String(customerAuthToken || ''));
    const normalizedReferralCode = normalizeReferralCode(referralCode);

    if (requestedCashbackRedeem > 0 && (!authenticatedCustomer || authenticatedCustomer.mobileNumber !== normalizedMobileNumber)) {
      return res.status(401).json({ error: 'Please login with this mobile number to redeem cashback.' });
    }

    const order = await prisma.$transaction(async (tx) => {
      const customer = normalizedMobileNumber
        ? await tx.customer.upsert({
          where: { mobileNumber: normalizedMobileNumber },
          update: {
            ...(customerName ? { name: customerName } : {}),
            ...(birthday ? { birthday: new Date(birthday) } : {}),
            ...(anniversary ? { anniversary: new Date(anniversary) } : {}),
          },
          create: {
            mobileNumber: normalizedMobileNumber,
            name: customerName || undefined,
            ...(birthday ? { birthday: new Date(birthday) } : {}),
            ...(anniversary ? { anniversary: new Date(anniversary) } : {}),
          },
        })
        : null;
      let customerReferralCode: string | null = null;
      if (customer) {
        customerReferralCode = await ensureCustomerReferralCode(tx, customer);
      }

      let referrerCustomer: any = null;
      let referralDiscount = 0;
      let referralApplied = false;
      if (normalizedReferralCode) {
        referrerCustomer = await tx.customer.findUnique({ where: { referralCode: normalizedReferralCode } });
        if (referrerCustomer) {
          const isSelfReferral = customer && referrerCustomer.id === customer.id;
          const priorOrders = customer ? await tx.order.count({ where: { customerId: customer.id } }) : 0;
          if (!isSelfReferral && priorOrders === 0) {
            referralDiscount = money(computedSubtotal * REFERRAL_DISCOUNT_RATE);
            referralApplied = true;
          }
        }
      }

      const preCashbackGrandTotal = money(computedSubtotal + normalizedGstAmount - normalizedDiscountAmount - referralDiscount + computedDeliveryAmount);
      const currentBalance = customer ? Number(customer.cashbackBalance) : 0;
      const normalizedCashbackRedeemed = customer && authenticatedCustomer
        ? money(Math.min(requestedCashbackRedeem, currentBalance, preCashbackGrandTotal))
        : 0;
      const normalizedGrandTotal = money(preCashbackGrandTotal - normalizedCashbackRedeemed);
      const normalizedCashbackEarned = money(normalizedGrandTotal * CASHBACK_RATE);
      let balanceAfterRedemption = currentBalance;

      const savedOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer ? customer.id : undefined,
          customerName,
          mobileNumber: normalizedMobileNumber || mobileNumber,
          whatsappNumber,
          birthday: birthday ? new Date(birthday) : customer ? customer.birthday : undefined,
          anniversary: anniversary ? new Date(anniversary) : customer ? customer.anniversary : undefined,
          email,
          address,
          tableNumber,
          orderType: orderType || 'DINE_IN',
          paymentMethod: paymentMethod || 'UPI',
          totalAmount: normalizedTotalAmount,
          gstAmount: normalizedGstAmount,
          discountAmount: normalizedDiscountAmount,
          referralCode: referralApplied ? normalizedReferralCode : null,
          referrerId: referralApplied && referrerCustomer ? referrerCustomer.id : undefined,
          referralDiscount: referralApplied ? referralDiscount : 0,
          cashbackRedeemed: normalizedCashbackRedeemed,
          cashbackEarned: normalizedCashbackEarned,
          grandTotal: normalizedGrandTotal,
          customerSessionToken,
          customerSessionExpiresAt: orderSessionExpiry(),
          orderItems: {
            create: orderItems
          }
        },
        include: orderInclude
      });

      if (customer && normalizedCashbackRedeemed > 0) {
        balanceAfterRedemption = money(currentBalance - normalizedCashbackRedeemed);
        await tx.customer.update({
          where: { id: customer.id },
          data: { cashbackBalance: balanceAfterRedemption },
        });
        await tx.cashbackTransaction.create({
          data: {
            customerId: customer.id,
            orderId: savedOrder.id,
            type: 'REDEEMED',
            amount: normalizedCashbackRedeemed,
            balanceAfter: balanceAfterRedemption,
            note: `Redeemed on order ${orderNumber}`,
          },
        });
      }

      if (customer && normalizedCashbackEarned > 0) {
        const balanceAfterEarn = money(balanceAfterRedemption + normalizedCashbackEarned);
        await tx.customer.update({
          where: { id: customer.id },
          data: { cashbackBalance: balanceAfterEarn },
        });
        await tx.cashbackTransaction.create({
          data: {
            customerId: customer.id,
            orderId: savedOrder.id,
            type: 'EARNED',
            amount: normalizedCashbackEarned,
            balanceAfter: balanceAfterEarn,
            note: `10% cashback earned on order ${orderNumber}`,
          },
        });
      }

      if (referralApplied && referrerCustomer) {
        const referrerReward = money(normalizedGrandTotal * REFERRAL_REWARD_RATE);
        if (referrerReward > 0) {
          const referrerBalance = Number(referrerCustomer.cashbackBalance);
          const referrerBalanceAfter = money(referrerBalance + referrerReward);
          await tx.customer.update({
            where: { id: referrerCustomer.id },
            data: { cashbackBalance: referrerBalanceAfter },
          });
          await tx.cashbackTransaction.create({
            data: {
              customerId: referrerCustomer.id,
              orderId: savedOrder.id,
              type: 'EARNED',
              amount: referrerReward,
              balanceAfter: referrerBalanceAfter,
              note: `Referral reward from order ${orderNumber}`,
            },
          });
        }
      }

      return { order: savedOrder, customerReferralCode, referralApplied };
    });

    sendAdminOrderWhatsApp(order.order).catch((error) => {
      console.error('WhatsApp admin notification error:', error);
    });

    res.status(201).json({
      ...order.order,
      customerReferralCode: order.customerReferralCode,
      referralApplied: order.referralApplied,
    });
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
