import React, { useState, useEffect } from 'react';
import inventoryService from '../services/inventoryService';
import UpdateStockModal from '../components/UpdateStockModal'; // Will create this next

const InventoryList = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProductInventory, setSelectedProductInventory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getAllInventory();
      setInventoryItems(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory.');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenModal = (item) => {
    setSelectedProductInventory(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedProductInventory(null);
    setIsModalOpen(false);
  };

  const handleStockUpdateSuccess = () => {
    fetchInventory(); // Re-fetch inventory to show updated data
    handleCloseModal();
  };

  if (loading) return <p>Loading inventory...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div className="container mt-4">
      <h2>Inventory Management</h2>
      {inventoryItems.length === 0 ? (
        <p>No inventory items found.</p>
      ) : (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Current Quantity</th>
              <th>Low Stock Threshold</th>
              <th>Last Stocked Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map(item => {
              const isLowStock = item.quantity <= item.low_stock_threshold;
              return (
                <tr key={item._id} className={isLowStock ? 'table-danger' : ''}>
                  <td>{item.product_id ? item.product_id.name : 'N/A'}</td>
                  <td>{item.product_id ? item.product_id.category : 'N/A'}</td>
                  <td>{item.quantity}</td>
                  <td>{item.low_stock_threshold}</td>
                  <td>{new Date(item.last_stocked_date).toLocaleDateString()}</td>
                  <td>
                    {isLowStock ? (
                      <span className="badge bg-danger">Low Stock</span>
                    ) : (
                      <span className="badge bg-success">In Stock</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleOpenModal(item)}
                    >
                      Update Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {isModalOpen && selectedProductInventory && (
        <UpdateStockModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          productInventory={selectedProductInventory} // Passing the whole inventory item
          onStockUpdate={handleStockUpdateSuccess}
        />
      )}
    </div>
  );
};

export default InventoryList;
