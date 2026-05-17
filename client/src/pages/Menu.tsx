import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Plus, Minus, Search } from 'lucide-react';
import API_URL from '../utils/api';

interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
}

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, cart, updateQuantity } = useCart();
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const categoryId = searchParams.get('category');

  useEffect(() => {
    axios.get(`${API_URL}/categories`).then(res => setCategories(res.data));
    
    const url = categoryId 
      ? `${API_URL}/menu?categoryId=${categoryId}`
      : `${API_URL}/menu`;
    
    axios.get(url).then(res => setFoodItems(res.data));
  }, [categoryId]);

  const filteredItems = foodItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getItemQuantity = (id: number) => {
    return cart.find(i => i.id === id)?.quantity || 0;
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Our Menu</h1>
        <div style={{ position: 'relative', minWidth: '300px' }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} size={20} />
          <input 
            type="text" 
            placeholder="Search for dishes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '10px' }}>
        <button 
          onClick={() => setSearchParams({})}
          style={{ 
            padding: '8px 20px', 
            borderRadius: '20px', 
            backgroundColor: !categoryId ? 'var(--primary-color)' : '#fff',
            color: !categoryId ? '#fff' : '#333',
            border: '1px solid #ddd'
          }}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setSearchParams({ category: cat.id.toString() })}
            style={{ 
              padding: '8px 20px', 
              borderRadius: '20px', 
              backgroundColor: categoryId === cat.id.toString() ? 'var(--primary-color)' : '#fff',
              color: categoryId === cat.id.toString() ? '#fff' : '#333',
              border: '1px solid #ddd',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
        {filteredItems.map(item => {
          const qty = getItemQuantity(item.id);
          return (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative' }}>
                <img src={item.image} alt={item.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <span style={{ 
                  position: 'absolute', 
                  top: '10px', 
                  right: '10px', 
                  backgroundColor: item.isVeg ? '#4caf50' : '#f44336', 
                  color: '#fff', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px' 
                }}>
                  {item.isVeg ? 'Veg' : 'Non-Veg'}
                </span>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>{item.name}</h3>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>₹{item.price}</span>
                </div>
                
                {qty === 0 ? (
                  <button 
                    onClick={() => addToCart({ ...item, quantity: 1 })}
                    className="btn-primary" 
                    style={{ width: '100%' }}
                  >
                    Add to Cart
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '5px' }}>
                    <button onClick={() => updateQuantity(item.id, qty - 1)} style={{ padding: '5px', borderRadius: '4px', backgroundColor: '#fff' }}><Minus size={18} /></button>
                    <span style={{ fontWeight: 'bold' }}>{qty}</span>
                    <button onClick={() => updateQuantity(item.id, qty + 1)} style={{ padding: '5px', borderRadius: '4px', backgroundColor: '#fff' }}><Plus size={18} /></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Menu;
