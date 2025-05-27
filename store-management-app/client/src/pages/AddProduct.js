import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import productService from '../services/productService';

const AddProduct = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddProduct = async (productData) => {
    try {
      await productService.createProduct(productData);
      setSuccessMessage('Product added successfully! Redirecting to product list...');
      setError(null);
      setTimeout(() => {
        navigate('/products');
      }, 2000); // Navigate after 2 seconds
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add product.');
      setSuccessMessage('');
      console.error('Error adding product:', err);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Add New Product</h2>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {successMessage && <div className="alert alert-success" role="alert">{successMessage}</div>}
      <ProductForm onSubmit={handleAddProduct} />
    </div>
  );
};

export default AddProduct;
