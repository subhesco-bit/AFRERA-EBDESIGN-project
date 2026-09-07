import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api';

/**
 * OrdersPage Component
 * Display user orders with status and actions
 */
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getOrders(filter ? { status: filter } : undefined);
      setOrders(response.data.data.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await ordersAPI.cancelOrder(orderId);

      loadOrders();
      alert('Order cancelled successfully');
    } catch (error) {
      alert(`Failed to cancel order: ${ error.message}`);
    }
  };

  if (loading) return <div className="page">Loading orders...</div>;

  return (
    <div className="page orders-page">
      <h1>My Orders</h1>

      <div className="orders-filter">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-item">
            <div className="order-header">
              <span className="order-id">Order #{order.id}</span>
              <span className={`order-status ${order.status}`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="order-details">
              <p>Items: {order.items?.length || 0}</p>
              <p>Total: ₹{order.totalAmount.toFixed(2)}</p>
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            {order.status === 'pending' && (
              <button
                onClick={() => handleCancelOrder(order.id)}
                className="cancel-btn"
              >
                Cancel Order
              </button>
            )}
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <p className="no-orders">No orders found</p>
      )}
    </div>
  );
}
