import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import ProductList from './components/ProductList';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import InventoryList from './pages/InventoryList';
import OrderList from './pages/OrderList'; // Import OrderList
import OrderDetail from './pages/OrderDetail'; // Import OrderDetail
import CreateOrder from './pages/CreateOrder'; // Import CreateOrder
import './App.css'; // Assuming basic styling will be added here

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">Store Management</Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link className="nav-link" to="/products">Products</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/inventory">Inventory</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/orders">Orders</Link>
                </li>
                {/* Add other navigation links here if needed */}
              </ul>
            </div>
          </div>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate replace to="/products" />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/products/edit/:id" element={<EditProduct />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/orders" element={<OrderList />} /> {/* Add OrderList Route */}
            <Route path="/orders/new" element={<CreateOrder />} /> {/* Add CreateOrder Route */}
            <Route path="/orders/:orderId" element={<OrderDetail />} /> {/* Add OrderDetail Route */}
            {/* Optional: A 404 Not Found Page component could be added here */}
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
