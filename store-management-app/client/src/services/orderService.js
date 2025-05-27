import axios from 'axios';

const API_BASE_URL = '/api/orders'; // Using relative URL due to proxy setup

const orderService = {
  createOrder: (orderData) => {
    return axios.post(API_BASE_URL, orderData);
  },

  getAllOrders: () => {
    return axios.get(API_BASE_URL);
  },

  getOrderById: (orderId) => {
    return axios.get(`${API_BASE_URL}/${orderId}`);
  },

  updateOrderStatus: (orderId, status) => {
    // The backend expects an object like { status: "NewStatus" }
    return axios.put(`${API_BASE_URL}/${orderId}/status`, { status });
  }
};

export default orderService;
