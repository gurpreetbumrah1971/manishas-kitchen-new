import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight } from 'lucide-react';
import logo from '../assets/logo.png';
import hero from '../assets/hero.png';
import API_URL from '../utils/api';

interface Category {
  id: number;
  name: string;
  image: string;
}

const Home = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    axios.get(`${API_URL}/categories`)
      .then(res => setCategories(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        height: '60vh',
        background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${hero}) no-repeat center/cover`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Savor the Authentic Flavors of Manisha's Kitchen</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '600px' }}>Experience the finest Indian cuisine, crafted with love and tradition.</p>
        <Link to="/menu" className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px' }}>Order Now</Link>
      </section>

      {/* Categories Section */}
      <section className="container" style={{ padding: '4rem 0' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2rem' }}>Explore Our Categories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          {categories.map(cat => (
            <Link key={cat.id} to={`/menu?category=${cat.id}`} className="card" style={{ textAlign: 'center', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem' }}>{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Us Section */}
      <section style={{ backgroundColor: '#fff', padding: '4rem 0' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Why Manisha's Kitchen?</h2>
            <ul style={{ listStyle: 'none' }}>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><ChevronRight color="var(--primary-color)" /> Authentic Traditional Recipes</li>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><ChevronRight color="var(--primary-color)" /> Fresh & High-Quality Ingredients</li>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><ChevronRight color="var(--primary-color)" /> Expert Chefs with Years of Experience</li>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><ChevronRight color="var(--primary-color)" /> Hygienic & Modern Kitchen</li>
            </ul>
          </div>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=600" alt="Restaurant Interior" style={{ width: '100%', borderRadius: '12px' }} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
