import axios from 'axios';

const API_BASE_URL = '/api/products'; // Using relative URL due to proxy setup

const productService = {
  getAllProducts: () => {
    return axios.get(API_BASE_URL);
  },

  getProductById: (id) => {
    return axios.get(`${API_BASE_URL}/${id}`);
  },

  createProduct: (productData) => {
    return axios.post(API_BASE_URL, productData);
  },

  updateProduct: (id, productData) => {
    return axios.put(`${API_BASE_URL}/${id}`, productData);
  },

  deleteProduct: (id) => {
    return axios.delete(`${API_BASE_URL}/${id}`);
  }
};

export default productService;
