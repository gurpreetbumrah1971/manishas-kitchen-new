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
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.RESEND_FROM_EMAIL || '').trim();
  if (!apiKey || !from) {
    console.warn('Order email notification skipped: missing RESEND_API_KEY or RESEND_FROM_EMAIL.');
    return;
  }

  const items = (order.orderItems || [])
    .map((item: any, index: number) => `${index + 1}. ${item.foodItem?.name || 'Food item'} x ${item.quantity} - ${money(item.subtotal)}`)
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

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: notificationRecipients(),
      subject: `New order ${order.orderNumber} - ${money(order.grandTotal)}`,
      text,
    }),
  });
  if (!response.ok) throw new Error(`Resend email request failed (${response.status}): ${await response.text()}`);
};
