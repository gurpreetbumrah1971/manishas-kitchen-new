const normalizeIndianMobile = (value?: string) => {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
};

export const openWhatsAppMessage = (mobile: string | undefined, message: string) => {
  const number = normalizeIndianMobile(mobile);
  if (!number) return;
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
};

export const orderTypeLabel = (orderType: string) => {
  if (orderType === 'DELIVERY') return 'Home Delivery';
  if (orderType === 'TAKEAWAY') return 'Takeaway';
  return 'Dine In';
};

export const buildOrderConfirmationMessage = (order: any) =>
  [
    'Order Confirmed!',
    `Order ID: ${order.orderNumber}`,
    `Total: ₹${order.grandTotal}`,
    `Type: ${orderTypeLabel(order.orderType)}`,
    '',
    "Thank you for ordering from Manisha's Kitchen."
  ].join('\n');

export const buildOrderDeliveryMessage = (order: any) =>
  [
    "Your order from Manisha's Kitchen is out for delivery!",
    `Order ID: ${order.orderNumber}`,
    `Total: ₹${order.grandTotal}`,
    '',
    'Please keep your phone available for the delivery partner.'
  ].join('\n');

export const buildCustomerOfferMessage = (customer: any) =>
  [
    `Hi ${customer.name || 'there'}!`,
    "Manisha's Kitchen has special offers waiting for your special day.",
    '',
    'Reply here to know today\'s offer.'
  ].join('\n');
