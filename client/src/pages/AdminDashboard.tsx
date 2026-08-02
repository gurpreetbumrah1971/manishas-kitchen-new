import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  MessageCircle
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
import { buildCustomerOfferMessage, openWhatsAppMessage } from '../utils/whatsapp';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const emptyMenuForm = {
  name: '',
  description: '',
  price: '',
  image: '',
  categoryId: '',
  isVeg: true,
  isAvailable: true,
};

const adminSections = [
  { id: 'orders', label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { id: 'menu', label: 'Menu', path: '/admin/menu', icon: ShoppingBag },
  { id: 'customers', label: 'LMS', path: '/admin/lms', icon: Users },
  { id: 'settings', label: 'Settings', path: '/admin/settings', icon: Settings },
  { id: 'overview', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
];

const adminPathToTab: Record<string, string> = {
  '/admin': 'orders',
  '/admin/': 'orders',
  '/admin/orders': 'orders',
  '/admin/menu': 'menu',
  '/admin/lms': 'customers',
  '/admin/customers': 'customers',
  '/admin/settings': 'settings',
  '/admin/dashboard': 'overview',
};

const adminNavStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 1rem',
  borderRadius: '8px',
  backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
  color: isActive ? '#fff' : '#666',
  textAlign: 'left',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
});

const AdminDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [isMenuFormOpen, setIsMenuFormOpen] = useState(false);
  const [savingMenuItem, setSavingMenuItem] = useState(false);
  const [selectedCustomerNumbers, setSelectedCustomerNumbers] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkMediaFile, setBulkMediaFile] = useState<File | null>(null);
  const [bulkMediaUrl, setBulkMediaUrl] = useState('');
  const [bulkSendingIndex, setBulkSendingIndex] = useState<number | null>(null);
  const [uploadingBulkMedia, setUploadingBulkMedia] = useState(false);
  const [preparationMinutesByOrder, setPreparationMinutesByOrder] = useState<Record<number, string>>({});
  const [updatingOrderActionById, setUpdatingOrderActionById] = useState<Record<number, string>>({});
  const [ringtoneEnabled, setRingtoneEnabled] = useState(localStorage.getItem('adminRingtoneEnabled') === '1');
  const [ringtoneBlocked, setRingtoneBlocked] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/admin';
  const activeTab = adminPathToTab[normalizedPath] || 'orders';
  const token = localStorage.getItem('adminToken');
  const adminSessionExpiresAt = localStorage.getItem('adminSessionExpiresAt');

  useEffect(() => {
    if (normalizedPath === '/admin') {
      navigate('/admin/orders', { replace: true });
      return;
    }

    if (!adminPathToTab[normalizedPath]) {
      navigate('/admin/orders', { replace: true });
    }
  }, [normalizedPath, navigate]);

  const stopRingtone = useCallback(() => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
  }, []);

  const playRingtoneTone = useCallback(async () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const context = audioContextRef.current;
      if (context.state !== 'running') {
        await context.resume();
      }

      if (context.state !== 'running') {
        setRingtoneBlocked(true);
        return;
      }

      const startAt = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, startAt);
      oscillator.frequency.setValueAtTime(660, startAt + 0.18);
      oscillator.frequency.setValueAtTime(880, startAt + 0.36);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.62);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.65);
      setRingtoneBlocked(false);
    } catch {
      setRingtoneBlocked(true);
    }
  }, []);

  const startRingtone = useCallback(() => {
    if (ringtoneTimerRef.current) return;
    void playRingtoneTone();
    ringtoneTimerRef.current = setInterval(() => {
      void playRingtoneTone();
    }, 1400);
  }, [playRingtoneTone]);

  const enableRingtone = async () => {
    localStorage.setItem('adminRingtoneEnabled', '1');
    setRingtoneEnabled(true);
    setRingtoneBlocked(false);
    await playRingtoneTone();
  };

  useEffect(() => {
    if (!token || (adminSessionExpiresAt && Date.now() > new Date(adminSessionExpiresAt).getTime())) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminSessionExpiresAt');
      navigate('/admin/login');
      return;
    }

    let active = true;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const handleAuthFailure = () => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminSessionExpiresAt');
      navigate('/admin/login');
    };
    const applyOrders = (nextOrders: any[]) => {
      if (!active) return;
      setOrders(nextOrders);
      setSelectedOrder(current => current ? nextOrders.find(order => order.id === current.id) || current : current);
    };

    const fetchOrders = async () => {
      try {
        const ordersRes = await axios.get(`${API_URL}/admin/orders`, config);
        applyOrders(ordersRes.data);
      } catch (err) {
        console.error(err);
        handleAuthFailure();
      }
    };

    const fetchData = async () => {
      try {
        const [ordersRes, menuRes, categoriesRes] = await Promise.all([
          axios.get(`${API_URL}/admin/orders`, config),
          axios.get(`${API_URL}/menu?admin=true`, config),
          axios.get(`${API_URL}/categories`, config)
        ]);
        applyOrders(ordersRes.data);
        if (active) {
          setMenuItems(menuRes.data);
          setCategories(categoriesRes.data);
        }
      } catch (err) {
        console.error(err);
        handleAuthFailure();
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    const poll = setInterval(fetchOrders, 15000);

    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [token, adminSessionExpiresAt, navigate]);

  useEffect(() => {
    const hasUnconfirmedPendingOrder = orders.some(order => order.status === 'PENDING' && !order.confirmedAt);
    if (hasUnconfirmedPendingOrder && ringtoneEnabled) {
      startRingtone();
      return;
    }

    stopRingtone();
  }, [orders, ringtoneEnabled, startRingtone, stopRingtone]);

  useEffect(() => () => stopRingtone(), [stopRingtone]);

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

  const resetMenuForm = () => {
    setMenuForm({
      ...emptyMenuForm,
      categoryId: selectedCategoryId === 'all' ? '' : selectedCategoryId,
    });
    setMenuImageFile(null);
    setEditingItemId(null);
    setIsMenuFormOpen(false);
  };

  const openAddMenuItem = () => {
    setMenuForm({
      ...emptyMenuForm,
      categoryId: selectedCategoryId === 'all' ? (categories[0]?.id?.toString() || '') : selectedCategoryId,
    });
    setMenuImageFile(null);
    setEditingItemId(null);
    setIsMenuFormOpen(true);
  };

  const openEditMenuItem = (item: any) => {
    setMenuForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      image: item.image || '',
      categoryId: item.categoryId?.toString() || '',
      isVeg: Boolean(item.isVeg),
      isAvailable: Boolean(item.isAvailable),
    });
    setMenuImageFile(null);
    setEditingItemId(item.id);
    setIsMenuFormOpen(true);
  };

  const saveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.categoryId) {
      alert('Please select a category');
      return;
    }

    try {
      setSavingMenuItem(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let imageUrl = menuForm.image;

      if (menuImageFile) {
        const imageData = new FormData();
        imageData.append('image', menuImageFile);
        const uploadRes = await axios.post(`${API_URL}/admin/uploads/menu-image`, imageData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        });
        imageUrl = uploadRes.data.imageUrl;
      }

      const payload = {
        ...menuForm,
        image: imageUrl,
        price: Number(menuForm.price),
        categoryId: Number(menuForm.categoryId),
      };

      const res = editingItemId
        ? await axios.put(`${API_URL}/admin/menu/${editingItemId}`, payload, config)
        : await axios.post(`${API_URL}/admin/menu`, payload, config);

      setMenuItems(items => editingItemId
        ? items.map(item => item.id === editingItemId ? res.data : item)
        : [res.data, ...items]
      );
      resetMenuForm();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save menu item');
    } finally {
      setSavingMenuItem(false);
    }
  };

  const deleteMenuItem = async (item: any) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;

    try {
      await axios.delete(`${API_URL}/admin/menu/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(items => items.filter(current => current.id !== item.id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete menu item');
    }
  };

  const replaceOrder = (updatedOrder: any) => {
    setOrders(current => current.map(order => order.id === updatedOrder.id ? updatedOrder : order));
    if (selectedOrder?.id === updatedOrder.id) {
      setSelectedOrder(updatedOrder);
    }
  };

  const orderStatusLabel = (order: any) => {
    if (order.status === 'DELIVERED') return 'DELIVERED';
    if (order.status === 'COMPLETED') return 'READY';
    if (order.status === 'PREPARING') return 'PREPARING';
    if (order.confirmedAt) return 'CONFIRMED';
    return order.status;
  };

  const orderStatusStyle = (order: any) => {
    const label = orderStatusLabel(order);
    if (label === 'PENDING') return { backgroundColor: '#fff3e0', color: '#ef6c00' };
    if (label === 'CONFIRMED') return { backgroundColor: '#fff8e1', color: '#8a5a00' };
    if (label === 'PREPARING') return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    if (label === 'READY' || label === 'DELIVERED') return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
    return { backgroundColor: '#ffebee', color: '#c62828' };
  };

  const updateOrderAction = async (order: any, action: string) => {
    setUpdatingOrderActionById(current => ({ ...current, [order.id]: action }));
    try {
      const payload: any = { action };
      if (action === 'PREPARING') {
        const minutes = Number(preparationMinutesByOrder[order.id] || order.preparationMinutes || 20);
        if (!Number.isFinite(minutes) || minutes < 1) {
          alert('Enter preparation time in minutes.');
          return;
        }
        payload.preparationMinutes = minutes;
      }

      const res = await axios.patch(`${API_URL}/admin/orders/${order.id}/status`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      replaceOrder(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update order');
    } finally {
      setUpdatingOrderActionById(current => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });
    }
  };

  const renderOrderActions = (order: any) => {
    const statusLabel = orderStatusLabel(order);
    const minutesValue = preparationMinutesByOrder[order.id] ?? String(order.preparationMinutes || 20);
    const updatingAction = updatingOrderActionById[order.id];

    return (
      <div style={{ display: 'grid', gap: '8px', minWidth: '230px' }}>
        {statusLabel === 'PENDING' && (
          <button disabled={Boolean(updatingAction)} onClick={() => updateOrderAction(order, 'CONFIRM')} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #25D366', backgroundColor: '#fff', color: '#128C7E', cursor: updatingAction ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, opacity: updatingAction ? 0.68 : 1 }}>
            <MessageCircle size={15} /> {updatingAction === 'CONFIRM' ? 'Confirming...' : 'Confirm Order'}
          </button>
        )}
        {statusLabel === 'CONFIRMED' && (
          <div style={{ display: 'grid', gridTemplateColumns: '72px minmax(110px, 1fr)', gap: '6px', alignItems: 'center' }}>
            <input
              type="number"
              min="1"
              max="180"
              value={minutesValue}
              onChange={(event) => setPreparationMinutesByOrder(current => ({ ...current, [order.id]: event.target.value }))}
              title="Preparation time in minutes"
              placeholder="Min"
              aria-label={`Preparation minutes for ${order.orderNumber}`}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.82rem' }}
            />
            <button disabled={Boolean(updatingAction)} onClick={() => updateOrderAction(order, 'PREPARING')} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #1976d2', backgroundColor: '#fff', color: '#1976d2', cursor: updatingAction ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, opacity: updatingAction ? 0.68 : 1 }}>
              <Clock size={15} /> {updatingAction === 'PREPARING' ? 'Updating...' : 'Start Preparation'}
            </button>
          </div>
        )}
        {order.status === 'PREPARING' && (
          <div style={{ display: 'grid', gap: '6px' }}>
            <small style={{ color: '#666', fontWeight: 700 }}>Preparation time: {order.preparationMinutes || minutesValue} min</small>
            <button disabled={Boolean(updatingAction)} onClick={() => updateOrderAction(order, 'READY')} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #2e7d32', backgroundColor: '#fff', color: '#2e7d32', cursor: updatingAction ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, opacity: updatingAction ? 0.68 : 1 }}>
              <CheckCircle size={15} /> {updatingAction === 'READY' ? 'Updating...' : 'Ready'}
            </button>
          </div>
        )}
        {order.status === 'COMPLETED' && (
          <button disabled={Boolean(updatingAction)} onClick={() => updateOrderAction(order, 'DELIVERED')} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #2e7d32', backgroundColor: '#2e7d32', color: '#fff', cursor: updatingAction ? 'wait' : 'pointer', fontWeight: 700, opacity: updatingAction ? 0.68 : 1 }}>
            {updatingAction === 'DELIVERED' ? 'Updating...' : 'Delivered'}
          </button>
        )}
      </div>
    );
  };

  const sendCustomerOffer = (customer: any) => {
    openWhatsAppMessage(customer.number, buildCustomerOfferMessage(customer));
  };

  const toggleCustomerSelection = (number: string) => {
    setSelectedCustomerNumbers(current =>
      current.includes(number)
        ? current.filter(item => item !== number)
        : [...current, number]
    );
  };

  const toggleAllCustomers = () => {
    setSelectedCustomerNumbers(selectedCustomerNumbers.length === customers.length
      ? []
      : customers.map((customer: any) => customer.number)
    );
  };

  const uploadBulkMedia = async () => {
    if (!bulkMediaFile) return bulkMediaUrl;

    try {
      setUploadingBulkMedia(true);
      const formData = new FormData();
      formData.append('media', bulkMediaFile);
      const res = await axios.post(`${API_URL}/admin/uploads/campaign-media`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      setBulkMediaUrl(res.data.mediaUrl);
      return res.data.mediaUrl;
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload campaign media');
      return '';
    } finally {
      setUploadingBulkMedia(false);
    }
  };

  const buildBulkMessage = (customer: any, mediaUrl: string) => {
    const text = bulkMessage.trim()
      .replace(/\{name\}/g, customer.name || '')
      .replace(/\{number\}/g, customer.number || '');
    return mediaUrl ? `${text}\n\nMedia: ${mediaUrl}` : text;
  };

  const sendBulkMessageAt = async (index: number) => {
    if (selectedCustomers.length === 0) return alert('Select at least one customer.');
    if (!bulkMessage.trim() && !bulkMediaFile && !bulkMediaUrl) return alert('Enter a message or upload media.');

    const mediaUrl = bulkMediaFile && !bulkMediaUrl ? await uploadBulkMedia() : bulkMediaUrl;
    if (bulkMediaFile && !mediaUrl) return;

    const customer = selectedCustomers[index];
    if (!customer) {
      setBulkSendingIndex(null);
      return;
    }

    openWhatsAppMessage(customer.number, buildBulkMessage(customer, mediaUrl));
    setBulkSendingIndex(index + 1 < selectedCustomers.length ? index + 1 : null);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminSessionExpiresAt');
    navigate('/admin/login');
  };

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const unconfirmedPendingOrders = orders.filter(o => o.status === 'PENDING' && !o.confirmedAt);
  const completedOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED').length;
  const visibleMenuItems = selectedCategoryId === 'all'
    ? menuItems
    : menuItems.filter(item => item.categoryId?.toString() === selectedCategoryId);
  const customers: any[] = Object.values(
    orders.reduce((acc: any, order) => {
      const number = order.whatsappNumber || order.mobileNumber || 'Unknown';
      if (!acc[number]) {
        acc[number] = {
          name: order.customerName,
          number,
          birthday: order.birthday,
          anniversary: order.anniversary,
          orders: [],
          totalSpent: 0,
          firstOrderAt: order.createdAt,
          latestOrderAt: order.createdAt,
        };
      }

      acc[number].name = order.customerName || acc[number].name;
      acc[number].birthday = order.birthday || acc[number].birthday;
      acc[number].anniversary = order.anniversary || acc[number].anniversary;
      acc[number].orders.push(order);
      acc[number].totalSpent += Number(order.grandTotal);
      if (new Date(order.createdAt) < new Date(acc[number].firstOrderAt)) {
        acc[number].firstOrderAt = order.createdAt;
      }
      if (new Date(order.createdAt) > new Date(acc[number].latestOrderAt)) {
        acc[number].latestOrderAt = order.createdAt;
      }
      return acc;
    }, {})
  ).sort((a: any, b: any) => new Date(b.latestOrderAt).getTime() - new Date(a.latestOrderAt).getTime());
  const selectedCustomers = customers.filter((customer: any) => selectedCustomerNumbers.includes(customer.number));

  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : '-';

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
              <span style={{
                fontSize: '0.8rem',
                padding: '4px 10px',
                borderRadius: '12px',
                fontWeight: 700,
                ...orderStatusStyle(selectedOrder)
              }}>
                {orderStatusLabel(selectedOrder)}
              </span>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '2px' }}>Date & Time</p>
              <p style={{ fontWeight: '600' }}>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Order Actions</h3>
            {renderOrderActions(selectedOrder)}
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
          
          <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <button 
              onClick={() => window.print()} 
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' }}
            >
              Print Receipt
            </button>
            <button 
              onClick={() => setSelectedOrder(null)} 
              className="btn-primary" 
              style={{ padding: '10px' }}
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
          {limit && <button onClick={() => navigate('/admin/orders')} style={{ color: 'var(--primary-color)', fontWeight: '600', background: 'none' }}>View All</button>}
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
                      fontWeight: 700,
                      ...orderStatusStyle(order)
                    }}>
                      {orderStatusLabel(order)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {renderOrderActions(order)}
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
          {adminSections.map(section => {
            const Icon = section.icon;
            return (
              <Link key={section.id} to={section.path} style={adminNavStyle(activeTab === section.id)}>
                <Icon size={20} /> {section.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 1rem', borderRadius: '8px', color: '#f44336', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {(!ringtoneEnabled || ringtoneBlocked || unconfirmedPendingOrders.length > 0) && (
          <div className="card" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            border: unconfirmedPendingOrders.length > 0 ? '1px solid #ffb74d' : '1px solid #eee',
            backgroundColor: unconfirmedPendingOrders.length > 0 ? '#fff8e1' : '#fff',
          }}>
            <div>
              <strong>
                {unconfirmedPendingOrders.length > 0
                  ? `${unconfirmedPendingOrders.length} order${unconfirmedPendingOrders.length === 1 ? '' : 's'} awaiting confirmation`
                  : 'Order ringtone'}
              </strong>
              <p style={{ color: '#666', fontSize: '0.86rem', marginTop: '4px' }}>
                {ringtoneEnabled && !ringtoneBlocked
                  ? 'Ringtone is enabled. Confirm pending orders to stop the sound.'
                  : 'Tap once to enable ringtone alerts on this device.'}
              </p>
            </div>
            {(!ringtoneEnabled || ringtoneBlocked) && (
              <button onClick={enableRingtone} className="btn-primary" style={{ padding: '10px 14px' }}>
                Enable Ringtone
              </button>
            )}
          </div>
        )}

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.8rem' }}>Menu Management</h1>
              <button onClick={openAddMenuItem} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} /> Add Item
              </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: '600' }}>Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  style={{ minWidth: '220px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>{visibleMenuItems.length} items</span>
              </div>
            </div>

            {isMenuFormOpen && (
              <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>{editingItemId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
                  <button onClick={resetMenuForm} style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Close form">
                    <X size={22} />
                  </button>
                </div>

                <form onSubmit={saveMenuItem}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Name</label>
                      <input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Category</label>
                      <select value={menuForm.categoryId} onChange={(e) => setMenuForm({ ...menuForm, categoryId: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Price</label>
                      <input type="number" min="1" step="0.01" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setMenuImageFile(e.target.files?.[0] || null)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff' }}
                      />
                      {(menuImageFile || menuForm.image) && (
                        <small style={{ display: 'block', marginTop: '6px', color: '#666' }}>
                          {menuImageFile ? menuImageFile.name : 'Current image will be kept'}
                        </small>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Description</label>
                    <textarea value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                      <input type="checkbox" checked={menuForm.isVeg} onChange={(e) => setMenuForm({ ...menuForm, isVeg: e.target.checked })} />
                      Veg item
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                      <input type="checkbox" checked={menuForm.isAvailable} onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })} />
                      Available
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={resetMenuForm} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={savingMenuItem}>{savingMenuItem ? 'Saving...' : 'Save Item'}</button>
                  </div>
                </form>
              </div>
            )}

            <div className="card">
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}><h3>Items</h3></div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <th style={{ padding: '1rem' }}>Item</th>
                      <th style={{ padding: '1rem' }}>Category</th>
                      <th style={{ padding: '1rem' }}>Price</th>
                      <th style={{ padding: '1rem' }}>Availability</th>
                      <th style={{ padding: '1rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMenuItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontWeight: '600' }}>{item.name}</div>
                              <small style={{ color: '#666' }}>{item.isVeg ? 'Veg' : 'Non-Veg'}</small>
                            </div>
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
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEditMenuItem(item)} title="Edit item" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' }}>
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => deleteMenuItem(item)} title="Delete item" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', color: '#c62828', cursor: 'pointer' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {visibleMenuItems.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No menu items found for this category.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'customers' && (
          <>
            <h1 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>Customer LMS</h1>
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div>
                  <h3>Bulk WhatsApp Campaign</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>Use {'{name}'} and {'{number}'} in the message for personalization.</p>
                </div>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>{selectedCustomers.length} selected</span>
              </div>
              <textarea
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="Enter WhatsApp message text..."
                rows={4}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical', marginBottom: '1rem' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '600' }}>Image / Video</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      setBulkMediaFile(e.target.files?.[0] || null);
                      setBulkMediaUrl('');
                    }}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff' }}
                  />
                  {(bulkMediaFile || bulkMediaUrl) && (
                    <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                      {bulkMediaFile?.name || bulkMediaUrl}
                    </small>
                  )}
                </div>
                <button
                  onClick={() => sendBulkMessageAt(0)}
                  disabled={uploadingBulkMedia || selectedCustomers.length === 0}
                  className="btn-primary"
                  style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <MessageCircle size={18} /> {uploadingBulkMedia ? 'Uploading...' : 'Start Bulk Send'}
                </button>
                {bulkSendingIndex !== null && (
                  <button
                    onClick={() => sendBulkMessageAt(bulkSendingIndex)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #25D366', backgroundColor: '#fff', color: '#128C7E', cursor: 'pointer', fontWeight: '700' }}
                  >
                    Send Next ({bulkSendingIndex + 1}/{selectedCustomers.length})
                  </button>
                )}
              </div>
            </div>
            <div className="card">
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h3>Customer Lifecycle</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>Order dates are captured from each order timestamp.</p>
                </div>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>{customers.length} customers</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <th style={{ padding: '1rem' }}>
                        <input type="checkbox" checked={customers.length > 0 && selectedCustomerNumbers.length === customers.length} onChange={toggleAllCustomers} />
                      </th>
                      <th style={{ padding: '1rem' }}>Name</th>
                      <th style={{ padding: '1rem' }}>Number</th>
                      <th style={{ padding: '1rem' }}>Birthday</th>
                      <th style={{ padding: '1rem' }}>Anniversary</th>
                      <th style={{ padding: '1rem' }}>Orders</th>
                      <th style={{ padding: '1rem' }}>Total Spent</th>
                      <th style={{ padding: '1rem' }}>First Order</th>
                      <th style={{ padding: '1rem' }}>Last Order</th>
                      <th style={{ padding: '1rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer: any) => (
                      <React.Fragment key={customer.number}>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '1rem' }}>
                            <input type="checkbox" checked={selectedCustomerNumbers.includes(customer.number)} onChange={() => toggleCustomerSelection(customer.number)} />
                          </td>
                          <td style={{ padding: '1rem', fontWeight: '600' }}>{customer.name}</td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{customer.number}</span>
                              {customer.number !== 'Unknown' && (
                                <a href={`https://wa.me/91${customer.number}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', fontSize: '0.85rem' }}>WhatsApp</a>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>{formatDate(customer.birthday)}</td>
                          <td style={{ padding: '1rem' }}>{formatDate(customer.anniversary)}</td>
                          <td style={{ padding: '1rem' }}>{customer.orders.length}</td>
                          <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--primary-color)' }}>₹{customer.totalSpent}</td>
                          <td style={{ padding: '1rem' }}>{formatDate(customer.firstOrderAt)}</td>
                          <td style={{ padding: '1rem' }}>{formatDate(customer.latestOrderAt)}</td>
                          <td style={{ padding: '1rem' }}>
                            <button onClick={() => sendCustomerOffer(customer)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #25D366', backgroundColor: '#fff', color: '#128C7E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                              <MessageCircle size={15} /> Offer
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={10} style={{ padding: '0 1rem 1rem', backgroundColor: '#fcfcfc' }}>
                            <details>
                              <summary style={{ cursor: 'pointer', color: 'var(--primary-color)', fontWeight: '600', padding: '0.75rem 0' }}>Order History</summary>
                              <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {customer.orders.map((order: any) => (
                                  <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr 1fr 1fr', gap: '1rem', padding: '0.75rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}>
                                    <button onClick={() => setSelectedOrder(order)} style={{ color: 'var(--primary-color)', fontWeight: '700', background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
                                      {order.orderNumber}
                                    </button>
                                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                                    <span>{order.orderType}</span>
                                    <span>{orderStatusLabel(order)}</span>
                                    <span style={{ fontWeight: '700' }}>₹{order.grandTotal}</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No customer data found yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <OrderDetailsModal />
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
