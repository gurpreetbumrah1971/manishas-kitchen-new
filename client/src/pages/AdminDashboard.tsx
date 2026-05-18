import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import API_URL from '../utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [ordersRes, menuRes] = await Promise.all([
          axios.get(`${API_URL}/admin/orders`, config),
          axios.get(`${API_URL}/menu?admin=true`, config)
        ]);
        setOrders(ordersRes.data);
        setMenuItems(menuRes.data);
      } catch (err) {
        console.error(err);
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const toggleAvailability = async (id: number, currentStatus: boolean) => {
    try {
      await axios.patch(`${API_URL}/admin/menu/${id}/availability`, { 
        isAvailable: !currentStatus 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(menuItems.map(item => item.id === id ? { ...item, isAvailable: !currentStatus } : item));
    } catch (err) {
      alert('Failed to update availability');
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.patch(`${API_URL}/admin/orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
      if (selectedOrder?.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;

  // Chart Data
  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Daily Sales (₹)',
        data: [12000, 19000, 15000, 22000, 30000, 45000, 38000],
        backgroundColor: 'rgba(211, 47, 47, 0.6)',
      },
    ],
  };

  const pieData = {
    labels: ['Snacks', 'Meals', 'Beverages', 'Custom'],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: ['#d32f2f', '#ff9800', '#4caf50', '#2196f3'],
      },
    ],
  };

  const OrderDetailsModal = () => {
    if (!selectedOrder) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
        padding: '1rem'
      }}>
        <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Order Details: {selectedOrder.orderNumber}</h2>
            <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '2px' }}>Customer Name</p>
              <p style={{ fontWeight: '600' }}>{selectedOrder.customerName}</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '2px' }}>WhatsApp/Mobile</p>
              <p style={{ fontWeight: '600' }}>{selectedOrder.whatsappNumber || selectedOrder.mobileNumber}</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '2px' }}>Order Type</p>
              <p style={{ fontWeight: '600' }}><span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#eee' }}>{selectedOrder.orderType}</span></p>
            </div>
            {selectedOrder.tableNumber && (
              <div>
                <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '2px' }}>Table Number</p>
                <p style={{ fontWeight: '600' }}>{selectedOrder.tableNumber}</p>
              </div>
            )}
            <div>
              <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '2px' }}>Order Status</p>
              <select 
                value={selectedOrder.status} 
                onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem', fontWeight: '600' }}
              >
                <option value="PENDING">Pending</option>
                <option value="PREPARING">Preparing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '2px' }}>Date & Time</p>
              <p style={{ fontWeight: '600' }}>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Items</h3>
          <div style={{ backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '1rem' }}>
            {selectedOrder.orderItems.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img src={item.foodItem.image} alt={item.foodItem.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.foodItem.name}</p>
                    <p style={{ fontSize: '0.8rem', color: '#666' }}>₹{item.unitPrice} × {item.quantity}</p>
                  </div>
                </div>
                <p style={{ fontWeight: '600' }}>₹{item.subtotal}</p>
              </div>
            ))}
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Subtotal</span>
                <span>₹{selectedOrder.totalAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Discount</span>
                <span>-₹{selectedOrder.discountAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #eee' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--primary-color)' }}>₹{selectedOrder.grandTotal}</span>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => window.print()} 
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' }}
            >
              Print Receipt
            </button>
            <button 
              onClick={() => setSelectedOrder(null)} 
              className="btn-primary" 
              style={{ flex: 1, padding: '10px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderOrdersTable = (limit?: number) => {
    const displayOrders = limit ? orders.slice(0, limit) : orders;
    return (
      <div className="card">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{limit ? 'Recent Orders' : 'All Orders'}</h3>
          {limit && <button onClick={() => setActiveTab('orders')} style={{ color: 'var(--primary-color)', fontWeight: '600', background: 'none' }}>View All</button>}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th style={{ padding: '1rem' }}>Order ID</th>
                <th style={{ padding: '1rem' }}>Customer</th>
                <th style={{ padding: '1rem' }}>Amount</th>
                <th style={{ padding: '1rem' }}>Type</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => setSelectedOrder(order)} 
                      style={{ color: 'var(--primary-color)', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      {order.orderNumber}
                    </button>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {order.customerName}<br/>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <small style={{ color: '#666' }}>{order.whatsappNumber || order.mobileNumber}</small>
                      <a 
                        href={`https://wa.me/91${order.whatsappNumber || order.mobileNumber}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: '#25D366', display: 'flex', alignItems: 'center' }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      </a>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>₹{order.grandTotal}</td>
                  <td style={{ padding: '1rem' }}><span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#eee' }}>{order.orderType}</span></td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      backgroundColor: 
                        order.status === 'PENDING' ? '#fff3e0' : 
                        order.status === 'PREPARING' ? '#e3f2fd' : 
                        order.status === 'COMPLETED' ? '#e8f5e9' :
                        '#ffebee',
                      color:
                        order.status === 'PENDING' ? '#ef6c00' : 
                        order.status === 'PREPARING' ? '#1976d2' : 
                        order.status === 'COMPLETED' ? '#2e7d32' :
                        '#c62828'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={order.status} 
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PREPARING">Preparing</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <OrderDetailsModal />
      </div>
    );
  };

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading Dashboard...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', backgroundColor: '#fff', borderRight: '1px solid #ddd', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)', padding: '0 1rem' }}>Admin Panel</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '12px 1rem', 
              borderRadius: '8px', 
              backgroundColor: activeTab === 'overview' ? 'var(--primary-color)' : 'transparent', 
              color: activeTab === 'overview' ? '#fff' : '#666', 
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '12px 1rem', 
              borderRadius: '8px', 
              backgroundColor: activeTab === 'orders' ? 'var(--primary-color)' : 'transparent', 
              color: activeTab === 'orders' ? '#fff' : '#666', 
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <ShoppingBag size={20} /> Orders
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '12px 1rem', 
              borderRadius: '8px', 
              backgroundColor: activeTab === 'menu' ? 'var(--primary-color)' : 'transparent', 
              color: activeTab === 'menu' ? '#fff' : '#666', 
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <ShoppingBag size={20} /> Menu
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '12px 1rem', 
              borderRadius: '8px', 
              backgroundColor: activeTab === 'settings' ? 'var(--primary-color)' : 'transparent', 
              color: activeTab === 'settings' ? '#fff' : '#666', 
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Settings size={20} /> Settings
          </button>
        </nav>
        <button onClick={logout} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 1rem', borderRadius: '8px', color: '#f44336', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {activeTab === 'overview' && (
          <>
            <h1 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>Dashboard Overview</h1>
            
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}><TrendingUp color="#1976d2" /></div>
                <div><p style={{ color: '#666', fontSize: '0.8rem' }}>Total Revenue</p><h3 style={{ fontSize: '1.4rem' }}>₹{totalRevenue}</h3></div>
              </div>
              <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '10px', backgroundColor: '#fff3e0', borderRadius: '8px' }}><Clock color="#ef6c00" /></div>
                <div><p style={{ color: '#666', fontSize: '0.8rem' }}>Pending Orders</p><h3 style={{ fontSize: '1.4rem' }}>{pendingOrders}</h3></div>
              </div>
              <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}><CheckCircle color="#2e7d32" /></div>
                <div><p style={{ color: '#666', fontSize: '0.8rem' }}>Completed</p><h3 style={{ fontSize: '1.4rem' }}>{completedOrders}</h3></div>
              </div>
              <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '8px' }}><Users color="#7b1fa2" /></div>
                <div><p style={{ color: '#666', fontSize: '0.8rem' }}>Total Orders</p><h3 style={{ fontSize: '1.4rem' }}>{orders.length}</h3></div>
              </div>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Weekly Sales</h3>
                <Bar data={barData} />
              </div>
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Category Split</h3>
                <Pie data={pieData} />
              </div>
            </div>

            {renderOrdersTable(5)}
          </>
        )}

        {activeTab === 'orders' && (
          <>
            <h1 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>Order Management</h1>
            {renderOrdersTable()}
          </>
        )}

        {activeTab === 'menu' && (
          <>
            <h1 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>Menu Management</h1>
            <div className="card">
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}><h3>Item Availability</h3></div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <th style={{ padding: '1rem' }}>Item</th>
                      <th style={{ padding: '1rem' }}>Category</th>
                      <th style={{ padding: '1rem' }}>Price</th>
                      <th style={{ padding: '1rem' }}>Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>{item.category?.name}</td>
                        <td style={{ padding: '1rem' }}>₹{item.price}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', color: item.isAvailable ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                              {item.isAvailable ? 'AVAILABLE' : 'OUT OF STOCK'}
                            </span>
                            <label className="switch">
                              <input 
                                type="checkbox" 
                                checked={item.isAvailable} 
                                onChange={() => toggleAvailability(item.id, item.isAvailable)}
                              />
                              <span className="slider"></span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <h1 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>Settings</h1>
            <div className="card" style={{ padding: '2rem' }}>
              <h3>General Settings</h3>
              <p style={{ color: '#666', marginTop: '1rem' }}>Settings module is currently under development. Here you will be able to manage:</p>
              <ul style={{ marginTop: '1rem', color: '#666', lineHeight: '1.8' }}>
                <li>Restaurant Name & Contact Info</li>
                <li>Operating Hours</li>
                <li>Menu Item Availability</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
