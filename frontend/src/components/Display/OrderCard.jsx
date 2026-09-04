import React from 'react';

/**
 * OrderCard Component
 * Displays order summary with status and actions
 */
export default function OrderCard({
  id,
  date,
  totalAmount,
  status,
  itemCount,
  onClick,
  onCancel,
}) {
  const statusColors = {
    pending: 'hsl(var(--sev-warning))',
    confirmed: 'hsl(var(--data-real))',
    shipped: 'hsl(var(--coldchain-ok))',
    delivered: 'hsl(var(--data-real))',
    cancelled: 'hsl(var(--destructive))',
  };

  return (
    <div className="order-card" onClick={onClick}>
      <div className="order-header">
        <div>
          <p className="order-id">Order #{id}</p>
          <p className="order-date">
            {new Date(date).toLocaleDateString('en-IN')}
          </p>
        </div>
        <span
          className="order-status"
          style={{ backgroundColor: statusColors[status] }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="order-details">
        <div className="order-items">
          <p className="items-label">{itemCount} item(s)</p>
        </div>
        <div className="order-amount">
          <p className="amount-label">Total</p>
          <p className="amount-value">₹{totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {status === 'pending' && onCancel && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel(id);
          }}
          className="cancel-btn"
        >
          Cancel Order
        </button>
      )}
    </div>
  );
}
