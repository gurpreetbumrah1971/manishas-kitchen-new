import React, { useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../utils/api';

const Checkout = () => {
  const { cart, totalAmount, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: '',
    whatsappNumber: '',
    orderType: 'DINE_IN',
    paymentMethod: 'CASH',
    tableNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Your cart is empty!');

    setLoading(true);
    const gstAmount = 0; // Removed GST
    const grandTotal = totalAmount;

    const orderData = {
      customerName: formData.customerName,
      whatsappNumber: formData.whatsappNumber,
      mobileNumber: formData.whatsappNumber, // Use WhatsApp number as mobile number
      orderType: formData.orderType,
      paymentMethod: formData.paymentMethod,
      tableNumber: formData.tableNumber,
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
      
      const message = `Order Confirmed!\nOrder ID: ${res.data.orderNumber}\nTotal: ₹${grandTotal}\nType: ${formData.orderType}\nThank you for ordering from Manisha's Kitchen.`;
      const waUrl = `https://wa.me/91${formData.whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      setTimeout(() => {
        window.open(waUrl, '_blank');
        navigate('/');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.error || 'Failed to place order';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <h1 style={{ color: '#4caf50', marginBottom: '1rem' }}>Order Placed Successfully!</h1>
        <p>Your order is being prepared. You will receive a WhatsApp notification shortly.</p>
        <p>Redirecting to home...</p>
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
                </select>
              </div>
              {formData.orderType === 'DINE_IN' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Table Number</label>
                  <input type="text" name="tableNumber" value={formData.tableNumber} onChange={handleChange} placeholder="e.g. 5" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Payment Method</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '5px' }}>
                * Payment can be made at the counter for Dine-in and Takeaway.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '15px' }}>
              {loading ? 'Processing...' : `Book Order (Pay Later)`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
