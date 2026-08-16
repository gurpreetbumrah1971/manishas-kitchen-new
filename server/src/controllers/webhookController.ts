import { Request, Response } from 'express';
import prisma from '../prisma';

export const handleMsg91WhatsAppWebhook = async (req: Request, res: Response) => {
  const expectedSecret = process.env.MSG91_WEBHOOK_SECRET;
  if (expectedSecret && req.headers['x-webhook-secret'] !== expectedSecret) {
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }

  // Acknowledge immediately; MSG91 expects a response within 8 seconds and retries on timeout.
  res.status(200).json({ received: true });

  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];

    for (const event of events) {
      const requestId: string | undefined = event?.requestId || event?.request_id;
      const eventName: string | undefined = event?.eventName || event?.event;
      if (!requestId || !eventName) continue;

      await prisma.order.updateMany({
        where: { whatsappMessageId: requestId },
        data: {
          whatsappStatus: String(eventName).toLowerCase(),
          whatsappStatusAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('MSG91 webhook processing error:', error);
  }
};
