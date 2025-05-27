import axios from 'axios';

const API_BASE_URL = '/api/inventory'; // Using relative URL due to proxy setup

const inventoryService = {
  getAllInventory: () => {
    return axios.get(API_BASE_URL);
  },

  getInventoryByProductId: (productId) => {
    // This function might be useful for a dedicated product inventory view,
    // but for the current task, getAllInventory might be sufficient.
    return axios.get(`${API_BASE_URL}/${productId}`);
  },

  updateInventory: (productId, inventoryData) => {
    // inventoryData should be an object like { quantity, low_stock_threshold }
    return axios.put(`${API_BASE_URL}/${productId}`, inventoryData);
  }
};

export default inventoryService;
