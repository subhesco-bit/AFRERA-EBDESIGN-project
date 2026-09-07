import React from 'react';

/**
 * ProductCard Component
 * Displays product information with image, price, rating
 */
export default function ProductCard({
  id,
  name,
  price,
  image,
  rating,
  reviews,
  onClick,
  onAddToCart,
}) {
  return (
    <div className="product-card" onClick={onClick}>
      {image && <img src={image} alt={name} className="product-image" />}

      <div className="product-info">
        <h3 className="product-name">{name}</h3>

        <div className="product-rating">
          <span className="stars">
            {'⭐'.repeat(Math.floor(rating || 0))}
          </span>
          <span className="rating-value">{rating || 0}</span>
          {reviews && <span className="reviews">({reviews} reviews)</span>}
        </div>

        <div className="product-footer">
          <p className="product-price">₹{price}</p>
          {onAddToCart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart({ id, name, price });
              }}
              className="add-to-cart-btn"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
