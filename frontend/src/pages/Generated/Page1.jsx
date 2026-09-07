import React, { useState, useEffect } from 'react';
import { productsAPI } from '../../services/api';

/**
 * ProductsPage Component
 * Display all products with search and filter
 */
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    loadProducts();
  }, [search, category]);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getProducts({ search, category });
      setProducts(response.data.data.products);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
  };

  if (loading) return <div className="page">Loading products...</div>;

  return (
    <div className="page products-page">
      <h1>Products</h1>

      <div className="products-filters">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="category-select"
        >
          <option value="">All Categories</option>
          <option value="grains">Grains</option>
          <option value="beverages">Beverages</option>
          <option value="food">Food</option>
        </select>
      </div>

      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-item">
            <h3>{product.name}</h3>
            <p className="price">₹{product.price}</p>
            <p className="rating">⭐ {product.rating} ({product.reviews} reviews)</p>
            <button
              onClick={() => handleAddToCart(product)}
              className="add-btn"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <p className="no-results">No products found</p>
      )}
    </div>
  );
}
