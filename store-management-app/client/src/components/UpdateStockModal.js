import React, { useState, useEffect } from 'react';
import inventoryService from '../services/inventoryService';
import './UpdateStockModal.css'; // We'll create this for basic modal styling

const UpdateStockModal = ({ isOpen, onClose, productInventory, onStockUpdate }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    low_stock_threshold: ''
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (productInventory) {
      setFormData({
        quantity: productInventory.quantity !== undefined ? String(productInventory.quantity) : '',
        low_stock_threshold: productInventory.low_stock_threshold !== undefined ? String(productInventory.low_stock_threshold) : ''
      });
    }
  }, [productInventory]);

  if (!isOpen || !productInventory) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (formData.quantity === '' || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      setError('Quantity must be a non-negative number.');
      return false;
    }
    if (formData.low_stock_threshold === '' || isNaN(Number(formData.low_stock_threshold)) || Number(formData.low_stock_threshold) < 0) {
      setError('Low stock threshold must be a non-negative number.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);
    try {
      const dataToUpdate = {
        quantity: Number(formData.quantity),
        low_stock_threshold: Number(formData.low_stock_threshold)
      };
      // productInventory contains product_id object, we need productInventory.product_id._id
      await inventoryService.updateInventory(productInventory.product_id._id, dataToUpdate);
      onStockUpdate(); // This should re-fetch data in InventoryList and close modal
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update stock.');
      console.error('Error updating stock:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>Update Stock for: {productInventory.product_id ? productInventory.product_id.name : 'Product'}</h4>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="quantity" className="form-label">Quantity <span style={{color: "red"}}>*</span></label>
            <input
              type="number"
              className="form-control"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="low_stock_threshold" className="form-label">Low Stock Threshold <span style={{color: "red"}}>*</span></label>
            <input
              type="number"
              className="form-control"
              id="low_stock_threshold"
              name="low_stock_threshold"
              value={formData.low_stock_threshold}
              onChange={handleChange}
              min="0"
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Stock'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateStockModal;
