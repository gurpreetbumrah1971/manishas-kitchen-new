import nodemailer from 'nodemailer';

const DEFAULT_RECIPIENTS = [
  'gurpreet.bumrah@gmail.com',
  'manishaskitchen2026@gmail.com',
];

const money = (value: unknown) => `Rs. ${Number(value || 0).toFixed(2)}`;

const notificationRecipients = () => {
  const configuredRecipients = String(process.env.ORDER_NOTIFICATION_RECIPIENTS || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
  return configuredRecipients.length ? configuredRecipients : DEFAULT_RECIPIENTS;
};

export const sendOrderNotificationEmail = async (order: any) => {
  const user = String(process.env.EMAIL_SMTP_USER || '').trim();
  const pass = String(process.env.EMAIL_SMTP_PASS || '').trim();
  if (!user || !pass) {
    console.warn('Order email notification skipped: missing EMAIL_SMTP_USER or EMAIL_SMTP_PASS.');
    return;
  }

  const port = Number(process.env.EMAIL_SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: String(process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com').trim(),
    port,
    secure: String(process.env.EMAIL_SMTP_SECURE || (port === 465 ? 'true' : 'false')).toLowerCase() === 'true',
    auth: { user, pass },
  });

  const items = (order.orderItems || [])
    .map((item: any, index: number) => `${index + 1}. ${item.foodItem?.name || 'Food item'} x ${item.quantity} — ${money(item.subtotal)}`)
    .join('\n') || 'No items listed';
  const deliveryDetails = order.address ? `\nAddress: ${order.address}` : '';
  const tableDetails = order.tableNumber ? `\nTable: ${order.tableNumber}` : '';
  const text = [
    'New order received',
    '',
    `Order ID: ${order.orderNumber}`,
    `Placed: ${new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    `Customer: ${order.customerName || 'Not provided'}`,
    `Mobile: ${order.mobileNumber || order.whatsappNumber || 'Not provided'}`,
    `Order type: ${String(order.orderType || '').replace(/_/g, ' ')}`,
    `Payment: ${order.paymentMethod || 'Not provided'}${tableDetails}${deliveryDetails}`,
    '',
    'Items:',
    items,
    '',
    `Food subtotal: ${money(order.totalAmount)}`,
    `GST: ${money(order.gstAmount)}`,
    `Discount: ${money(order.discountAmount)}`,
    `Grand total: ${money(order.grandTotal)}`,
  ].join('\n');

  await transporter.sendMail({
    from: process.env.ORDER_EMAIL_FROM || user,
    to: notificationRecipients().join(', '),
    subject: `New order ${order.orderNumber} — ${money(order.grandTotal)}`,
    text,
  });
};
