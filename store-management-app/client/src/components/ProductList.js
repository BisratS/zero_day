import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts();
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch products.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(id);
        fetchProducts(); // Refresh the list
      } catch (err) {
        setError(err.message || 'Failed to delete product.');
        console.error('Error deleting product:', err);
      }
    }
  };

  if (loading) return <p>Loading products...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div className="product-list-container">
      <h2>Product List</h2>
      <Link to="/products/add" className="btn btn-primary mb-3">Add New Product</Link>
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <ul className="list-group">
          {products.map(product => (
            <li key={product._id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <h5>{product.name}</h5>
                <p>Price: ${product.price ? product.price.toFixed(2) : 'N/A'}</p>
                {product.category && <p><small>Category: {product.category}</small></p>}
              </div>
              <div>
                <button 
                  onClick={() => navigate(`/products/edit/${product._id}`)} 
                  className="btn btn-sm btn-warning me-2"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(product._id)} 
                  className="btn btn-sm btn-danger"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductList;
