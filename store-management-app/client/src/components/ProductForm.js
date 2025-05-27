import React, { useState, useEffect } from 'react';

const ProductForm = ({ initialData = {}, onSubmit, isEditMode = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price !== undefined ? String(initialData.price) : '',
        image_url: initialData.image_url || '',
        category: initialData.category || ''
      });
    }
  }, [initialData, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Price must be a non-negative number.';
    }
    // Basic URL validation (optional, can be more complex)
    if (formData.image_url && !formData.image_url.startsWith('http')) {
        newErrors.image_url = 'Image URL must be a valid URL (e.g., start with http/https).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSubmit = {
        ...formData,
        price: Number(formData.price) // Ensure price is a number
      };
      onSubmit(dataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div className="mb-3">
        <label htmlFor="name" className="form-label">Name <span style={{color: "red"}}>*</span></label>
        <input
          type="text"
          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="description" className="form-label">Description</label>
        <textarea
          className="form-control"
          id="description"
          name="description"
          rows="3"
          value={formData.description}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="mb-3">
        <label htmlFor="price" className="form-label">Price <span style={{color: "red"}}>*</span></label>
        <input
          type="number"
          className={`form-control ${errors.price ? 'is-invalid' : ''}`}
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          step="0.01"
        />
        {errors.price && <div className="invalid-feedback">{errors.price}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="image_url" className="form-label">Image URL</label>
        <input
          type="text"
          className={`form-control ${errors.image_url ? 'is-invalid' : ''}`}
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
        />
        {errors.image_url && <div className="invalid-feedback">{errors.image_url}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="category" className="form-label">Category</label>
        <input
          type="text"
          className="form-control"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="btn btn-success">
        {isEditMode ? 'Update Product' : 'Add Product'}
      </button>
    </form>
  );
};

export default ProductForm;
