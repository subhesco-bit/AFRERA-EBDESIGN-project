import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PremiumMarketplace.module.css';

export default function PremiumMarketplacePage() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 100000,
    category: '',
    certification: '',
    minVolume: 0
  });
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPremiumProducts();
  }, []);

  const mockProducts = [
    { id: 1, name: 'Basmati Rice', variety: 'Sella Basmati', certification: 'Organic', retailPrice: 85, bulkPrice: 78, volumePrice: 72, rating: 4.8, reviews: 245, stock: 500, image: '🌾' },
    { id: 2, name: 'Turmeric Powder', variety: 'Alleppey', certification: 'GI Tagged', retailPrice: 450, bulkPrice: 380, volumePrice: 320, rating: 4.9, reviews: 156, stock: 200, image: '🟡' },
    { id: 3, name: 'Cardamom', variety: 'Kerala Green', certification: 'Export Grade', retailPrice: 2200, bulkPrice: 1980, volumePrice: 1760, rating: 4.7, reviews: 98, stock: 50, image: '🌱' },
    { id: 4, name: 'Honey', variety: 'Wildflower', certification: 'Fair Trade', retailPrice: 320, bulkPrice: 290, volumePrice: 260, rating: 4.6, reviews: 312, stock: 300, image: '🍯' },
    { id: 5, name: 'Ghee', variety: 'Pure Cow', certification: 'Organic', retailPrice: 680, bulkPrice: 612, volumePrice: 544, rating: 4.9, reviews: 189, stock: 150, image: '🥛' },
    { id: 6, name: 'Lentils (Masoor)', variety: 'Red Split', certification: 'Certified', retailPrice: 95, bulkPrice: 85, volumePrice: 75, rating: 4.5, reviews: 201, stock: 800, image: '🔴' },
  ];

  const fetchPremiumProducts = async () => {
    try {
      setLoading(true);
      // Try API first, fallback to mock data if it fails
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/ecommerceRoutes/premium-products', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }).catch(() => null);

      if (response?.ok) {
        const data = await response.json();
        setProducts(data.products || mockProducts);
      } else {
        // Use mock data if API fails
        setProducts(mockProducts);
      }
    } catch (error) {
      console.error('Failed to load premium products, using mock data:', error);
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Add items to cart first');
      return;
    }
    navigate('/checkout', { state: { cartItems: cart, isPremium: true } });
  };

  if (loading) return <div className={styles.loading}>Loading premium products...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🌟 Premium Agricultural Marketplace</h1>
        <p>Access exclusive, premium-certified products with volume discounts</p>
      </header>

      <div className={styles.mainContent}>
        {/* Filters Sidebar */}
        <aside className={styles.sidebar}>
          <h3>Filters</h3>

          <div className={styles.filterGroup}>
            <label>Price Range (₹)</label>
            <input
              type="range"
              name="priceMin"
              min="0"
              max="50000"
              value={filters.priceMin}
              onChange={applyFilters}
              className={styles.slider}
            />
            <span>₹{filters.priceMin.toLocaleString()} - ₹{filters.priceMax.toLocaleString()}</span>
          </div>

          <div className={styles.filterGroup}>
            <label>Category</label>
            <select name="category" value={filters.category} onChange={applyFilters}>
              <option value="">All Categories</option>
              <option value="organic">Organic Certified</option>
              <option value="gi">GI Tagged Products</option>
              <option value="export">Export Grade</option>
              <option value="heirloom">Heirloom Varieties</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Certification</label>
            <select name="certification" value={filters.certification} onChange={applyFilters}>
              <option value="">Any Certification</option>
              <option value="organic">Organic</option>
              <option value="fair-trade">Fair Trade</option>
              <option value="rainforest">Rainforest Alliance</option>
              <option value="iso">ISO Certified</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Minimum Order Volume (kg)</label>
            <input
              type="number"
              name="minVolume"
              value={filters.minVolume}
              onChange={applyFilters}
              placeholder="0"
              className={styles.input}
            />
          </div>

          <button className={styles.resetBtn} onClick={() => {
            setFilters({ priceMin: 0, priceMax: 100000, category: '', certification: '', minVolume: 0 });
            fetchPremiumProducts();
          }}>Reset Filters</button>
        </aside>

        {/* Products Grid */}
        <section className={styles.productsSection}>
          <div className={styles.productsHeader}>
            <h2>Premium Products ({products.length})</h2>
            <div className={styles.viewOptions}>
              <button className={styles.viewBtn}>Grid</button>
              <button className={styles.viewBtn}>List</button>
            </div>
          </div>

          <div className={styles.productsGrid}>
            {products.map(product => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.imageContainer}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className={styles.placeholderImage}>🖼️ No Image</div>
                  )}
                  <span className={styles.badge}>{product.certification || 'Premium'}</span>
                </div>

                <div className={styles.productInfo}>
                  <h3>{product.name}</h3>
                  <p className={styles.variety}>{product.variety || 'Regional Variety'}</p>

                  <div className={styles.pricing}>
                    <div className={styles.priceRow}>
                      <span>Retail (1-10 kg):</span>
                      <strong>₹{product.retailPrice}/kg</strong>
                    </div>
                    <div className={styles.priceRow}>
                      <span>Bulk (11-100 kg):</span>
                      <strong className={styles.discount}>₹{product.bulkPrice}/kg</strong>
                    </div>
                    <div className={styles.priceRow}>
                      <span>Volume (100+ kg):</span>
                      <strong className={styles.discount}>₹{product.volumePrice}/kg</strong>
                    </div>
                  </div>

                  <div className={styles.productMeta}>
                    <span>⭐ {product.rating || 4.5} ({product.reviews || 0} reviews)</span>
                    <span>📦 {product.stock || 0} kg available</span>
                  </div>

                  <button
                    className={styles.addToCartBtn}
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className={styles.emptyState}>
              <p>No premium products found matching your filters</p>
              <button onClick={fetchPremiumProducts}>Clear Filters</button>
            </div>
          )}
        </section>

        {/* Cart Summary Sidebar */}
        <aside className={styles.cartSidebar}>
          <h3>Cart Summary</h3>
          <div className={styles.cartItems}>
            {cart.length === 0 ? (
              <p className={styles.emptyCart}>Your cart is empty</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} className={styles.cartItem}>
                    <span>{item.name}</span>
                    <span>× {item.quantity}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {cart.length > 0 && (
            <div className={styles.cartFooter}>
              <div className={styles.totalItems}>
                <strong>Items:</strong> {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <div className={styles.volumeDiscount}>
                <small>💡 Volume discounts apply on checkout</small>
              </div>
              <button className={styles.checkoutBtn} onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          )}

          <div className={styles.benefits}>
            <h4>Premium Benefits</h4>
            <ul>
              <li>✅ Quality certified products</li>
              <li>📊 Real-time pricing updates</li>
              <li>🚚 Fast logistics coordination</li>
              <li>💰 Volume-based discounts</li>
              <li>📱 Dedicated support</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
