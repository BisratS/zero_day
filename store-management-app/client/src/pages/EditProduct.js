import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import productService from '../services/productService';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await productService.getProductById(id);
        setProduct(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch product.');
        console.error(`Error fetching product with id ${id}:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleEditProduct = async (productData) => {
    try {
      await productService.updateProduct(id, productData);
      setSuccessMessage('Product updated successfully! Redirecting to product list...');
      setError(null);
      setTimeout(() => {
        navigate('/products');
      }, 2000); // Navigate after 2 seconds
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update product.');
      setSuccessMessage('');
      console.error(`Error updating product with id ${id}:`, err);
    }
  };

  if (loading) return <p>Loading product details...</p>;
  if (error && !product) return <div className="alert alert-danger" role="alert">Error: {error}</div>;
  // Show form even if there was an error updating, so user can retry.
  // Only block form if initial load failed.

  return (
    <div className="container mt-4">
      <h2>Edit Product</h2>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {successMessage && <div className="alert alert-success" role="alert">{successMessage}</div>}
      {product ? (
        <ProductForm initialData={product} onSubmit={handleEditProduct} isEditMode={true} />
      ) : (
        <p>Product data could not be loaded.</p> 
      )}
    </div>
  );
};

export default EditProduct;
