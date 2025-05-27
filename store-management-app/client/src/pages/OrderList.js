import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await orderService.getAllOrders();
        setOrders(response.data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch orders.');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Order List</h2>
        <Link to="/orders/new" className="btn btn-success">Create New Order</Link>
      </div>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer ID</th>
                <th>Order Date</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>
                    <Link to={`/orders/${order._id}`}>{order._id}</Link>
                  </td>
                  <td>{order.customer_id || 'N/A'}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>${order.total_amount ? order.total_amount.toFixed(2) : '0.00'}</td>
                  <td>
                    <span className={`badge bg-${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => navigate(`/orders/${order._id}`)}
                      className="btn btn-sm btn-info"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Helper function to determine badge color based on status
const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return 'warning text-dark';
    case 'Processing': return 'primary';
    case 'Shipped': return 'info text-dark';
    case 'Delivered': return 'success';
    case 'Cancelled': return 'danger';
    default: return 'secondary';
  }
};

export default OrderList;
