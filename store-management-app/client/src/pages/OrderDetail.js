import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState('');

  const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    setUpdateError(null);
    setUpdateSuccess('');
    try {
      const response = await orderService.getOrderById(orderId);
      setOrder(response.data);
      setSelectedStatus(response.data.status); // Initialize dropdown with current status
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch order details.');
      console.error(`Error fetching order ${orderId}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === order.status) {
      setUpdateError("Please select a new status to update.");
      return;
    }
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess('');
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, selectedStatus);
      setOrder(updatedOrder.data); // Update local order state with the response
      setSelectedStatus(updatedOrder.data.status);
      setUpdateSuccess('Order status updated successfully!');
    } catch (err) {
      setUpdateError(err.response?.data?.message || err.message || 'Failed to update status.');
      console.error('Error updating status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <p>Loading order details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!order) return <p>Order not found.</p>;

  return (
    <div className="container mt-4 order-detail-container">
      <h2>Order Details - ID: {order._id}</h2>
      
      {updateError && <div className="alert alert-danger">{updateError}</div>}
      {updateSuccess && <div className="alert alert-success">{updateSuccess}</div>}

      <div className="card mb-4">
        <div className="card-header">Order Summary</div>
        <div className="card-body">
          <p><strong>Customer ID:</strong> {order.customer_id || 'N/A'}</p>
          <p><strong>Order Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
          <p><strong>Total Amount:</strong> ${order.total_amount ? order.total_amount.toFixed(2) : '0.00'}</p>
          <p><strong>Current Status:</strong> <span className={`badge bg-${getStatusColor(order.status)}`}>{order.status}</span></p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">Update Status</div>
        <div className="card-body">
          <div className="input-group">
            <select 
              className="form-select" 
              value={selectedStatus} 
              onChange={handleStatusChange}
              disabled={isUpdating}
            >
              {orderStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button 
              className="btn btn-primary" 
              onClick={handleUpdateStatus} 
              disabled={isUpdating || selectedStatus === order.status}
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">Shipping & Billing</div>
        <div className="card-body row">
            <div className="col-md-6">
                <h5>Shipping Address</h5>
                <p>{order.shipping_address || 'Not provided'}</p>
            </div>
            <div className="col-md-6">
                <h5>Billing Address</h5>
                <p>{order.billing_address || 'Not provided'}</p>
            </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Order Items</div>
        <div className="card-body">
          {order.items && order.items.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Image</th>
                    <th>Quantity</th>
                    <th>Price Per Unit</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={item.product_id?._id || index}>
                      <td>{item.product_id ? item.product_id.name : 'Product not available'}</td>
                      <td>
                        {item.product_id && item.product_id.image_url ? (
                          <img src={item.product_id.image_url} alt={item.product_id.name} style={{width: '50px', height: '50px', objectFit: 'cover'}}/>
                        ) : 'No image'}
                      </td>
                      <td>{item.quantity}</td>
                      <td>${item.price_per_unit ? item.price_per_unit.toFixed(2) : 'N/A'}</td>
                      <td>${(item.quantity * item.price_per_unit).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No items in this order.</p>
          )}
        </div>
      </div>
      
      <button className="btn btn-secondary mt-3" onClick={() => navigate('/orders')}>
        Back to Order List
      </button>
    </div>
  );
};

// Helper function (can be moved to a utils file if used elsewhere)
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

export default OrderDetail;
