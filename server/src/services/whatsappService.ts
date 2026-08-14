const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v23.0';
const WHATSAPP_ADMIN_NUMBER = process.env.WHATSAPP_ADMIN_NUMBER || '919819068372';
const WHATSAPP_LANGUAGE_CODE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';

type OrderForWhatsApp = {
  orderNumber: string;
  customerName?: string | null;
  mobileNumber?: string | null;
  whatsappNumber?: string | null;
  address?: string | null;
  tableNumber?: string | null;
  orderType?: string | null;
  paymentMethod?: string | null;
  totalAmount?: unknown;
  gstAmount?: unknown;
  discountAmount?: unknown;
  grandTotal?: unknown;
  orderItems?: Array<{
    quantity: number;
    unitPrice: unknown;
    subtotal: unknown;
    foodItem?: {
      name?: string | null;
    } | null;
  }>;
};

const normalizePhoneNumber = (number?: string | null) => {
  if (!number) return '';
  const digits = String(number).replace(/\D+/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const money = (value?: unknown) => {
  const amount = Number(value) || 0;
  return `Rs. ${amount.toFixed(2)}`;
};

const buildAdminOrderMessage = (order: OrderForWhatsApp) => {
  const items = (order.orderItems || [])
    .map((item, index) => {
      const name = item.foodItem?.name || 'Food item';
      return `${index + 1}. ${name} x ${item.quantity} - ${money(item.subtotal)}`;
    })
    .join('\n');

  return [
    'New order received',
    `Order ID: ${order.orderNumber}`,
    `Customer: ${order.customerName || 'Not provided'}`,
    `Phone: ${order.whatsappNumber || order.mobileNumber || 'Not provided'}`,
    `Order type: ${order.orderType || 'Not provided'}`,
    order.tableNumber ? `Table: ${order.tableNumber}` : null,
    order.address ? `Address: ${order.address}` : null,
    `Payment: ${order.paymentMethod || 'Not provided'}`,
    '',
    'Items:',
    items || 'No items listed',
    '',
    `Subtotal: ${money(order.totalAmount)}`,
    `GST: ${money(order.gstAmount)}`,
    `Discount: ${money(order.discountAmount)}`,
    `Total: ${money(order.grandTotal)}`,
  ].filter((line) => line !== null).join('\n');
};

const buildTemplatePayload = (recipient: string, order: OrderForWhatsApp, templateName: string) => ({
  messaging_product: 'whatsapp',
  to: recipient,
  type: 'template',
  template: {
    name: templateName,
    language: { code: WHATSAPP_LANGUAGE_CODE },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: order.orderNumber },
          { type: 'text', text: order.customerName || 'Customer' },
          { type: 'text', text: order.whatsappNumber || order.mobileNumber || 'Not provided' },
          { type: 'text', text: money(order.grandTotal) },
        ],
      },
    ],
  },
});

const buildTextPayload = (recipient: string, order: OrderForWhatsApp) => ({
  messaging_product: 'whatsapp',
  recipient_type: 'individual',
  to: recipient,
  type: 'text',
  text: {
    preview_url: false,
    body: buildAdminOrderMessage(order),
  },
});

const orderItemSummary = (order: OrderForWhatsApp) => (order.orderItems || [])
  .map((item) => `${item.foodItem?.name || 'Food item'} x ${item.quantity} (${money(item.subtotal)})`)
  .join(', ') || 'Your selected items';

const orderCostSummary = (order: OrderForWhatsApp) => [
  `Subtotal: ${money(order.totalAmount)}`,
  `GST: ${money(order.gstAmount)}`,
  `Discount: ${money(order.discountAmount)}`,
  `Total: ${money(order.grandTotal)}`,
].join(' | ');

const msg91CustomerConfirmationPayload = (senderNumber: string, recipient: string, order: OrderForWhatsApp) => {
  const templateName = process.env.MSG91_WHATSAPP_ORDER_TEMPLATE || 'order_confirmation';
  const namespace = process.env.MSG91_WHATSAPP_TEMPLATE_NAMESPACE;
  const template: Record<string, unknown> = {
    name: templateName,
    language: {
      code: process.env.MSG91_WHATSAPP_TEMPLATE_LANGUAGE || 'en',
      policy: 'deterministic',
    },
    to_and_components: [{
      to: [recipient],
      components: {
        body_1: { type: 'text', value: order.customerName || 'Customer' },
        body_2: { type: 'text', value: order.orderNumber },
        body_3: { type: 'text', value: orderItemSummary(order) },
        body_4: { type: 'text', value: String(order.orderType || 'ORDER').replace(/_/g, ' ') },
        body_5: { type: 'text', value: orderCostSummary(order) },
      },
    }],
  };
  if (namespace) template.namespace = namespace;

  return {
    integrated_number: senderNumber,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template,
    },
  };
};

export const sendCustomerOrderConfirmationMsg91 = async (order: OrderForWhatsApp) => {
  const authKey = process.env.MSG91_WHATSAPP_AUTHKEY || process.env.MSG91_AUTHKEY;
  const senderNumber = normalizePhoneNumber(process.env.MSG91_WHATSAPP_SENDER_NUMBER);
  const recipient = normalizePhoneNumber(order.whatsappNumber || order.mobileNumber);

  if (!authKey || !senderNumber || !recipient) {
    console.warn('MSG91 customer order confirmation skipped: missing auth key, sender number, or customer WhatsApp number');
    return { sent: false, skipped: true };
  }

  const payload = msg91CustomerConfirmationPayload(senderNumber, recipient, order);
  const response = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: authKey,
    },
    body: JSON.stringify(payload),
  });
  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('MSG91 customer order confirmation failed:', response.status, responseBody);
    return { sent: false, skipped: false, error: responseBody };
  }

  return { sent: true, skipped: false, response: responseBody };
};

export const sendAdminOrderWhatsApp = async (order: OrderForWhatsApp) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const adminRecipient = normalizePhoneNumber(WHATSAPP_ADMIN_NUMBER);
  const templateName = process.env.WHATSAPP_ADMIN_ORDER_TEMPLATE;

  if (!phoneNumberId || !accessToken || !adminRecipient) {
    console.warn('WhatsApp admin notification skipped: missing WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, or WHATSAPP_ADMIN_NUMBER');
    return { sent: false, skipped: true };
  }

  const payload = templateName
    ? buildTemplatePayload(adminRecipient, order, templateName)
    : buildTextPayload(adminRecipient, order);

  const response = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('WhatsApp admin notification failed:', response.status, responseBody);
    return { sent: false, skipped: false, error: responseBody };
  }

  return { sent: true, skipped: false, response: responseBody };
};
