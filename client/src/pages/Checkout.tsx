import React, { useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { ExternalLink, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../utils/api';
import { buildOrderConfirmationMessage, openWhatsAppMessage } from '../utils/whatsapp';

const UPI_ID = 'manishaskitchen2026@okaxis';
const UPI_PAY_LINK = `upi://pay?pa=${UPI_ID}`;

const Checkout = () => {
  const { cart, totalAmount, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: '',
    whatsappNumber: '',
    orderType: 'DINE_IN',
    paymentMethod: 'UPI',
    tableNumber: '',
    address: '',
    birthday: '',
    anniversary: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [placedOrder, setPlacedOrder] = useState({
    orderNumber: '',
    amount: 0,
    paymentMethod: 'UPI',
    whatsappUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Your cart is empty!');
    if (formData.orderType === 'DELIVERY' && !formData.address.trim()) {
      return alert('Please enter your home delivery address.');
    }

    setLoading(true);
    const gstAmount = 0; // Removed GST
    const grandTotal = totalAmount;

    const orderData = {
      customerName: formData.customerName,
      whatsappNumber: formData.whatsappNumber,
      mobileNumber: formData.whatsappNumber, // Use WhatsApp number as mobile number
      birthday: formData.birthday || undefined,
      anniversary: formData.anniversary || undefined,
      orderType: formData.orderType,
      paymentMethod: formData.paymentMethod,
      tableNumber: formData.tableNumber,
      address: formData.orderType === 'DELIVERY' ? formData.address : undefined,
      items: cart.map(item => ({
        foodItemId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity
      })),
      totalAmount,
      gstAmount,
      discountAmount: 0,
      grandTotal
    };

    try {
      const res = await axios.post(`${API_URL}/orders`, orderData);
      setSuccess(true);
      clearCart();
      
      const message = buildOrderConfirmationMessage(res.data);
      const orderNumber = res.data.orderNumber || res.data.order_number || `ORD-${Date.now()}`;
      const digits = formData.whatsappNumber.replace(/\D+/g, '');
      const normalizedNumber = digits.length === 10 ? `91${digits}` : digits;
      const whatsappUrl = `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
      setPlacedOrder({
        orderNumber,
        amount: grandTotal,
        paymentMethod: formData.paymentMethod,
        whatsappUrl,
      });

      setTimeout(() => openWhatsAppMessage(formData.whatsappNumber, message), 800);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response && err.response.data && err.response.data.error || 'Failed to place order';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const shouldShowUpi = placedOrder.paymentMethod === 'UPI';
    return (
      <div id="thank-you" className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <h1 style={{ color: '#4caf50', marginBottom: '1rem' }}>Thank you for your order!</h1>
        <p>Your order has been received. You will receive a WhatsApp notification shortly.</p>
        {shouldShowUpi && (
          <div style={{ maxWidth: '520px', margin: '2rem auto', border: '1px solid #eee', borderRadius: '8px', padding: '1.25rem', backgroundColor: '#fafafa' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Pay with UPI</h2>
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1rem' }}>Tap Pay and choose your UPI app. When you return, this thank-you page will still be here.</p>
            <a
              href={UPI_PAY_LINK}
              onClick={(event) => {
                event.preventDefault();
                window.location.href = UPI_PAY_LINK;
              }}
              style={{
                alignItems: 'center',
                background: 'var(--primary-color)',
                borderRadius: '8px',
                color: '#fff',
                display: 'flex',
                fontWeight: 700,
                gap: '10px',
                justifyContent: 'center',
                minHeight: '44px',
                padding: '10px 12px',
                textDecoration: 'none',
              }}
            >
              Pay
              <ExternalLink size={16} />
            </a>
            <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '1rem' }}>Amount: <strong style={{ color: 'var(--primary-color)' }}>₹{placedOrder.amount}</strong></div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>UPI ID: <a href={UPI_PAY_LINK} onClick={(event) => { event.preventDefault(); window.location.href = UPI_PAY_LINK; }}>{UPI_ID}</a></div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Order ID: {placedOrder.orderNumber}</div>
          </div>
        )}
        {placedOrder.whatsappUrl && (
          <a href={placedOrder.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-flex', marginRight: '0.75rem' }}>Send WhatsApp Confirmation</a>
        )}
        <button onClick={() => navigate('/menu')} className="btn-primary">Back to Menu</button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <ShoppingBag size={64} color="#ccc" style={{ marginBottom: '1rem' }} />
        <h1>Your Cart is Empty</h1>
        <p style={{ marginBottom: '2rem' }}>Add some delicious food from our menu to get started.</p>
        <button onClick={() => navigate('/menu')} className="btn-primary">Browse Menu</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>Checkout</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {/* Order Summary */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Order Summary</h2>
          <div className="card" style={{ padding: '1.5rem' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ fontSize: '0.9rem' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>₹{item.price} x {item.quantity}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>₹{item.price * item.quantity}</span>
                  <button onClick={() => removeFromCart(item.id)} style={{ color: '#f44336', background: 'none' }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '1rem', paddingTop: '1rem' }}>
                <span>Grand Total</span>
                <span style={{ color: 'var(--primary-color)' }}>₹{totalAmount}</span>
              </div>
              {formData.paymentMethod === 'UPI' && (
                <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', backgroundColor: '#fafafa', textAlign: 'center', marginTop: '1rem' }}>
                  <div style={{ marginBottom: '0.75rem', fontWeight: '700' }}>UPI payment available after order booking</div>
                  <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.75rem' }}>After placing your order, choose Google Pay, PhonePe, Paytm, or BHIM / UPI.</p>
                  <div style={{ fontSize: '0.9rem', color: '#555' }}>Amount: <strong style={{ color: 'var(--primary-color)' }}>₹{totalAmount}</strong></div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>UPI ID: <a href={UPI_PAY_LINK} onClick={(event) => { event.preventDefault(); window.location.href = UPI_PAY_LINK; }}>{UPI_ID}</a></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Details Form */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Customer Details</h2>
          <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Full Name *</label>
              <input type="text" name="customerName" required value={formData.customerName} onChange={handleChange} placeholder="Enter your name" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>WhatsApp Number *</label>
              <input type="tel" name="whatsappNumber" required value={formData.whatsappNumber} onChange={handleChange} placeholder="10-digit number" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Order Type</label>
                <select name="orderType" value={formData.orderType} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <option value="DINE_IN">Dine In</option>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DELIVERY">Home Delivery</option>
                </select>
              </div>
              {formData.orderType === 'DINE_IN' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Table Number</label>
                  <input type="text" name="tableNumber" value={formData.tableNumber} onChange={handleChange} placeholder="e.g. 5" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
              )}
            </div>

            {formData.orderType === 'DELIVERY' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Home Delivery Address *</label>
                <textarea
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House / flat number, street, landmark"
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', resize: 'vertical' }}
                />
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--primary-color)' }}>Hey! Lookout for special offers on your special day</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Birthday Date</label>
                  <input
                    type="date"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Anniversary Date</label>
                  <input
                    type="date"
                    name="anniversary"
                    value={formData.anniversary}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Payment Method</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '5px' }}>
                Choose UPI to pay from your preferred app after booking, or choose Cash for payment at counter / delivery.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '15px' }}>
              {loading ? 'Processing...' : 'Book Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
