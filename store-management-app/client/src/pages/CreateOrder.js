import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import productService from '../services/productService';

const CreateOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    shipping_address: '',
    billing_address: ''
  });
  const [orderItems, setOrderItems] = useState([]);
  
  // For adding a new item to the order
  const [selectedProductId, setSelectedProductId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(1);

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await productService.getAllProducts();
        setProducts(response.data);
      } catch (err) {
        setError('Failed to fetch products. Please try again later.');
        console.error('Error fetching products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItemToOrder = () => {
    if (!selectedProductId) {
      setError('Please select a product.');
      return;
    }
    if (currentQuantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    const productToAdd = products.find(p => p._id === selectedProductId);
    if (!productToAdd) {
      setError('Selected product not found.');
      return;
    }

    // Check if item already exists, if so, update quantity (optional, or just add new line)
    // For simplicity, we'll allow adding multiple lines for the same product
    // or one could implement logic to update quantity if product_id already in orderItems
    setOrderItems(prevItems => [
      ...prevItems,
      { 
        product_id: productToAdd._id, 
        name: productToAdd.name, // For display purposes in the form
        price: productToAdd.price, // For display
        quantity: parseInt(currentQuantity, 10)
      }
    ]);
    setSelectedProductId(''); // Reset for next item
    setCurrentQuantity(1);
    setError(null); // Clear any previous item-related error
  };

  const handleRemoveItem = (indexToRemove) => {
    setOrderItems(prevItems => prevItems.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      setError('Please add at least one product to the order.');
      return;
    }
    // Basic validation for required fields
    if (!formData.shipping_address.trim()) {
        setError('Shipping address is required.');
        return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage('');

    const orderData = {
      customer_id: formData.customer_id || null, // Send null if empty, backend might handle it
      items: orderItems.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
      shipping_address: formData.shipping_address,
      billing_address: formData.billing_address || formData.shipping_address // Default billing to shipping if empty
    };

    try {
      await orderService.createOrder(orderData);
      setSuccessMessage('Order created successfully! Redirecting to order list...');
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create order.');
      console.error('Error creating order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProducts) return <p>Loading product data...</p>;

  return (
    <div className="container mt-4 create-order-container">
      <h2>Create New Order</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <form onSubmit={handleSubmitOrder}>
        {/* Customer and Address Info */}
        <div className="card mb-3">
          <div className="card-header">Customer & Address Information</div>
          <div className="card-body">
            <div className="mb-3">
              <label htmlFor="customer_id" className="form-label">Customer ID (Optional)</label>
              <input type="text" className="form-control" id="customer_id" name="customer_id" value={formData.customer_id} onChange={handleFormChange} />
            </div>
            <div className="mb-3">
              <label htmlFor="shipping_address" className="form-label">Shipping Address <span style={{color: "red"}}>*</span></label>
              <textarea className="form-control" id="shipping_address" name="shipping_address" value={formData.shipping_address} onChange={handleFormChange} rows="3" required></textarea>
            </div>
            <div className="mb-3">
              <label htmlFor="billing_address" className="form-label">Billing Address (if different)</label>
              <textarea className="form-control" id="billing_address" name="billing_address" value={formData.billing_address} onChange={handleFormChange} rows="3"></textarea>
            </div>
          </div>
        </div>

        {/* Add Items to Order */}
        <div className="card mb-3">
          <div className="card-header">Order Items</div>
          <div className="card-body">
            <div className="row g-3 align-items-end mb-3">
              <div className="col-md-6">
                <label htmlFor="product_select" className="form-label">Select Product</label>
                <select 
                  id="product_select" 
                  className="form-select" 
                  value={selectedProductId} 
                  onChange={e => setSelectedProductId(e.target.value)}
                  disabled={products.length === 0}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} (${p.price.toFixed(2)})</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="quantity_input" className="form-label">Quantity</label>
                <input 
                  type="number" 
                  id="quantity_input" 
                  className="form-control" 
                  value={currentQuantity} 
                  onChange={e => setCurrentQuantity(e.target.value)} 
                  min="1"
                />
              </div>
              <div className="col-md-3">
                <button type="button" className="btn btn-info w-100" onClick={handleAddItemToOrder}>Add to Order</button>
              </div>
            </div>
            
            {/* Display Items Added to Order */}
            {orderItems.length > 0 && (
              <div className="mt-3">
                <h5>Items in Current Order:</h5>
                <ul className="list-group">
                  {orderItems.map((item, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        {item.name} (Qty: {item.quantity}) - Subtotal: ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveItem(index)}>Remove</button>
                    </li>
                  ))}
                </ul>
                <p className="fw-bold mt-2">
                  Estimated Total: $
                  {orderItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={isSubmitting || orderItems.length === 0}>
          {isSubmitting ? 'Submitting Order...' : 'Place Order'}
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/orders')} disabled={isSubmitting}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default CreateOrder;
