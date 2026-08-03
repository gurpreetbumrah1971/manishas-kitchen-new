import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { MessageCircle, ShoppingCart, User } from 'lucide-react';
import { CartProvider, useCart } from './context/CartContext';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import logo from './assets/logo.png';
import './index.css';

const Navbar = () => {
  const { totalItems } = useCart();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');
  const logoImage = (
    <img src={logo} alt="Manisha's Kitchen" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
  );
  
  return (
    <>
      <nav style={{ backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '0.2rem 0', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isAdminArea ? (
            <a href="/menu.html" style={{ display: 'flex', alignItems: 'center' }}>
              {logoImage}
            </a>
          ) : (
            <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
              {logoImage}
            </Link>
          )}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <a href="https://www.instagram.com/manishaskitchen2026" target="_blank" rel="noreferrer" aria-label="Manisha's Kitchen on Instagram" title="Instagram" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              color: '#fff',
              background: 'radial-gradient(circle at 30% 107%, #fdf497 0 5%, #fdf497 5% 12%, #fd5949 45%, #d6249f 60%, #285aeb 90%)'
            }}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1.9 }}>
                <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                <circle cx="12" cy="12" r="4"></circle>
                <circle cx="17.5" cy="6.5" r="1.2"></circle>
              </svg>
            </a>
            {isAdminArea ? (
              <a href="/menu.html" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Menu</a>
            ) : (
              <Link to="/menu" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Menu</Link>
            )}
            {isAdminArea ? (
              <a href="/checkout.html" style={{ position: 'relative' }}>
                <ShoppingCart size={28} />
              </a>
            ) : (
              <Link to="/checkout" style={{ position: 'relative' }}>
                <ShoppingCart size={28} />
                {totalItems > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: 'var(--primary-color)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {totalItems}
                  </span>
                )}
              </Link>
            )}
            <Link to="/admin/login"><User size={28} /></Link>
          </div>
        </div>
      </nav>
      {!isAdminArea && (
        <a href="https://wa.me/918879630082" target="_blank" rel="noreferrer" aria-label="Send WhatsApp message to Manisha's Kitchen" title="WhatsApp" style={{
          position: 'fixed',
          right: '1.25rem',
          bottom: '1.25rem',
          zIndex: 1200,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          backgroundColor: '#25d366',
          color: '#fff',
          boxShadow: '0 12px 30px rgba(18, 140, 126, 0.32)'
        }}>
          <MessageCircle size={32} />
        </a>
      )}
    </>
  );
};

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('adminToken');
  const expiresAt = localStorage.getItem('adminSessionExpiresAt');
  if (!token || (expiresAt && Date.now() > new Date(expiresAt).getTime())) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminSessionExpiresAt');
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  return (
    <CartProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <Navigate to="/admin/orders" replace />
              </ProtectedAdminRoute>
            }
          />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </CartProvider>
  );
};

export default App;
