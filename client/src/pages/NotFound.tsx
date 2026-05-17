import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
      <h1 style={{ fontSize: '6rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Oops! Page Not Found</h2>
      <p style={{ color: '#666', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <Home size={20} /> Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
