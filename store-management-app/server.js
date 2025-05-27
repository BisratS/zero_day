const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// MongoDB connection
const mongoURI = 'mongodb://localhost:27017/storeManagementApp';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image_url: { type: String },
  category: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Pre-save hook to update `updated_at`
productSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

productSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: Date.now() });
  next();
});


const Product = mongoose.model('Product', productSchema);

// Inventory Schema
const inventorySchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  last_stocked_date: {
    type: Date,
    default: Date.now
  },
  low_stock_threshold: {
    type: Number,
    default: 10
  }
});

// Pre-save hook for Inventory to update `last_stocked_date` if quantity is modified
inventorySchema.pre('save', function(next) {
  if (this.isModified('quantity')) {
    this.last_stocked_date = Date.now();
  }
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);

// OrderItem Schema (to be embedded in Order)
const orderItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price_per_unit: { // Price at the time of order
    type: Number,
    required: true
  }
}, { _id: false }); // No separate _id for sub-documents if not needed, or manage as needed

// Order Schema
const orderSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false // Or true, depending on business logic for anonymous orders
  },
  items: [orderItemSchema],
  total_amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  shipping_address: { type: String },
  billing_address: { type: String },
  order_date: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model('Order', orderSchema);


// API Routes for Products
const productRouter = express.Router();

// POST /api/products - Create a new product
productRouter.post('/', async (req, res) => {
  try {
    const { name, description, price, image_url, category, initial_quantity, low_stock_threshold } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Missing required fields: name and price' });
    }
    const newProduct = new Product({ name, description, price, image_url, category });
    await newProduct.save();

    // Create associated inventory record
    const newInventory = new Inventory({
      product_id: newProduct._id,
      quantity: initial_quantity !== undefined ? initial_quantity : 0, // Use provided initial_quantity or default to 0
      low_stock_threshold: low_stock_threshold !== undefined ? low_stock_threshold : 10 // Use provided or default
    });
    await newInventory.save();

    // Respond with the created product and its inventory (optional, or just product)
    // For simplicity, just returning the product as before, inventory is created in background.
    res.status(201).json(newProduct);
  } catch (error) {
    // If product saving failed, it won't proceed to inventory.
    // If inventory saving failed after product saved, product is created but inventory is not.
    // This could be handled with transactions in a replica set environment.
    // For now, log the error.
    console.error("Error during product or inventory creation:", error);
    res.status(500).json({ message: 'Error creating product or initial inventory', error: error.message });
  }
});

// GET /api/products - Retrieve all products
productRouter.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving products', error: error.message });
  }
});

// GET /api/products/:id - Retrieve a single product by ID
productRouter.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    // Handle cases where the ID format is invalid for MongoDB ObjectId
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Error retrieving product', error: error.message });
  }
});

// PUT /api/products/:id - Update a product by ID
productRouter.put('/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // `new: true` returns the updated document, `runValidators` ensures schema validation on update
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// DELETE /api/products/:id - Delete a product by ID
productRouter.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

app.use('/api/products', productRouter);

// API Routes for Inventory
const inventoryRouter = express.Router();

// GET /api/inventory - Retrieve all inventory records
inventoryRouter.get('/', async (req, res) => {
  try {
    const inventoryRecords = await Inventory.find().populate('product_id');
    res.status(200).json(inventoryRecords);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving inventory records', error: error.message });
  }
});

// GET /api/inventory/:productId - Retrieve inventory for a specific product
inventoryRouter.get('/:productId', async (req, res) => {
  try {
    const inventoryRecord = await Inventory.findOne({ product_id: req.params.productId }).populate('product_id');
    if (!inventoryRecord) {
      // Check if product exists, if not, then it's a true "not found for product"
      const product = await Product.findById(req.params.productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found, so no inventory record exists.' });
      }
      // If product exists but no inventory record, it's also a 404 for inventory
      return res.status(404).json({ message: 'Inventory record not found for this product.' });
    }
    res.status(200).json(inventoryRecord);
  } catch (error) {
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product or Inventory not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Error retrieving inventory record', error: error.message });
  }
});

// PUT /api/inventory/:productId - Update or Create inventory for a specific product
inventoryRouter.put('/:productId', async (req, res) => {
  const { productId } = req.params;
  const { quantity, low_stock_threshold } = req.body;

  if (quantity === undefined || typeof quantity !== 'number') {
    return res.status(400).json({ message: 'Quantity is required and must be a number.' });
  }

  try {
    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found. Cannot update/create inventory.' });
    }

    let inventoryRecord = await Inventory.findOne({ product_id: productId });
    let statusCode = 200;

    if (inventoryRecord) {
      // Update existing record
      inventoryRecord.quantity = quantity;
      if (low_stock_threshold !== undefined) {
        inventoryRecord.low_stock_threshold = low_stock_threshold;
      }
      // The pre-save hook will update last_stocked_date if quantity changes
    } else {
      // Create new inventory record
      inventoryRecord = new Inventory({
        product_id: productId,
        quantity: quantity,
        low_stock_threshold: low_stock_threshold !== undefined ? low_stock_threshold : 10
      });
      statusCode = 201; // Created
    }

    await inventoryRecord.save();
    const populatedRecord = await Inventory.findById(inventoryRecord._id).populate('product_id');
    res.status(statusCode).json(populatedRecord);

  } catch (error) {
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product or Inventory not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Error updating or creating inventory record', error: error.message });
  }
});


app.use('/api/inventory', inventoryRouter);

// API Routes for Orders
const orderRouter = express.Router();

// POST /api/orders - Create a new order
orderRouter.post('/', async (req, res) => {
  const { customer_id, items, shipping_address, billing_address } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order items are required and must be a non-empty array.' });
  }

  try {
    let calculatedTotalAmount = 0;
    const orderItemsData = []; // To store data for creating OrderItems sub-documents
    const inventoryUpdates = []; // To store inventory update operations

    // Phase 1: Validate items and check stock
    for (const item of items) {
      if (!item.product_id || item.quantity === undefined) {
        return res.status(400).json({ message: `Missing product_id or quantity for an item.` });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ message: `Quantity for product ${item.product_id} must be a positive number.`});
      }

      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.product_id} not found.` });
      }

      const inventory = await Inventory.findOne({ product_id: item.product_id });
      if (!inventory || inventory.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product: ${product.name}. Requested: ${item.quantity}, Available: ${inventory ? inventory.quantity : 0}` });
      }

      orderItemsData.push({
        product_id: product._id,
        quantity: item.quantity,
        price_per_unit: product.price // Price at the time of order
      });
      calculatedTotalAmount += product.price * item.quantity;

      inventoryUpdates.push({
        productId: product._id,
        newQuantity: inventory.quantity - item.quantity
      });
    }

    // Phase 2: Create Order
    const newOrder = new Order({
      customer_id, // Can be null if not provided
      items: orderItemsData,
      total_amount: calculatedTotalAmount,
      status: 'Pending',
      shipping_address,
      billing_address,
      order_date: new Date()
    });
    await newOrder.save();

    // Phase 3: Update Inventory for all items
    // This is not a true transaction, so if any update fails, data could be inconsistent.
    // For robustness, a transaction mechanism (e.g., MongoDB multi-document transactions with replica sets) would be needed.
    // Or a compensating transaction / job queue for retries.
    for (const update of inventoryUpdates) {
      await Inventory.findOneAndUpdate(
        { product_id: update.productId },
        { $set: { quantity: update.newQuantity, last_stocked_date: new Date() } } // Update last_stocked_date as well
      );
    }
    
    // Populate product details for the response
    const populatedOrder = await Order.findById(newOrder._id).populate('items.product_id', 'name price category image_url');

    res.status(201).json(populatedOrder);

  } catch (error) {
    console.error('Error creating order:', error);
    // Generic error, specific errors are handled and returned earlier
    res.status(500).json({ message: 'Failed to create order.', error: error.message });
  }
});


// GET /api/orders - Retrieve all orders
orderRouter.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product_id', 'name price category image_url')
      .populate('customer_id', 'first_name last_name email') // Populate customer details
      .sort({ order_date: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving orders', error: error.message });
  }
});

// GET /api/orders/:orderId - Retrieve a single order by ID
orderRouter.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.product_id', 'name price category image_url')
      .populate('customer_id', 'first_name last_name email'); // Populate customer details

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Order not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Error retrieving order', error: error.message });
  }
});

// PUT /api/orders/:orderId/status - Update order status
orderRouter.put('/:orderId/status', async (req, res) => {
  const { status } = req.body;
  const { orderId } = req.params;

  if (!status || !['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status provided. Valid statuses are: Pending, Processing, Shipped, Delivered, Cancelled.' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Note: Add logic here if cancelling an order should restock inventory.
    // This is a simplified version and does not restock inventory on 'Cancelled'.
    // if (order.status !== 'Cancelled' && status === 'Cancelled') {
    //   // Potentially iterate order.items and update inventory back
    // }
    
    order.status = status;
    await order.save();
    
    const populatedOrder = await Order.findById(order._id).populate('items.product_id', 'name price category image_url');
    res.status(200).json(populatedOrder);

  } catch (error) {
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Order not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

app.use('/api/orders', orderRouter);

// Customer Schema
const customerSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String },
  address: { type: String }, // Can be an object for more detail: street, city, etc.
  created_at: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', customerSchema);

// API Routes for Customers
const customerRouter = express.Router();

// POST /api/customers - Create a new customer
customerRouter.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address } = req.body;
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ message: 'Missing required fields: first_name, last_name, and email' });
    }
    const newCustomer = new Customer({ first_name, last_name, email, phone, address });
    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    if (error.code === 11000) { // MongoError: E11000 duplicate key error (for unique email)
      return res.status(409).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
});

// GET /api/customers - Retrieve all customers
customerRouter.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ created_at: -1 });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving customers', error: error.message });
  }
});

// GET /api/customers/:customerId - Retrieve a single customer by ID
customerRouter.get('/:customerId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Customer not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Error retrieving customer', error: error.message });
  }
});

// PUT /api/customers/:customerId - Update a customer by ID
customerRouter.put('/:customerId', async (req, res) => {
  try {
    // Ensure email updates are checked for uniqueness if email is part of req.body
    if (req.body.email) {
        const existingCustomer = await Customer.findOne({ email: req.body.email, _id: { $ne: req.params.customerId } });
        if (existingCustomer) {
            return res.status(409).json({ message: 'Email already in use by another customer.' });
        }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.customerId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(updatedCustomer);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Customer not found (invalid ID format)' });
    }
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        // This specific check might be redundant if the pre-check above is robust
        return res.status(409).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
});

// DELETE /api/customers/:customerId - Delete a customer by ID
customerRouter.delete('/:customerId', async (req, res) => {
  try {
    // Optional: Check if customer has orders and decide on deletion policy
    // For now, direct deletion.
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.customerId);
    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Customer not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
});

app.use('/api/customers', customerRouter);

// Supplier Schema
const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact_person: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String },
  address: { type: String },
  created_at: { type: Date, default: Date.now }
});

const Supplier = mongoose.model('Supplier', supplierSchema);

// API Routes for Suppliers
const supplierRouter = express.Router();

// POST /api/suppliers - Create a new supplier
supplierRouter.post('/', async (req, res) => {
  try {
    const { name, contact_person, email, phone, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Missing required fields: name and email' });
    }
    const newSupplier = new Supplier({ name, contact_person, email, phone, address });
    await newSupplier.save();
    res.status(201).json(newSupplier);
  } catch (error) {
    if (error.code === 11000) { // MongoError: E11000 duplicate key error
      return res.status(409).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Error creating supplier', error: error.message });
  }
});

// GET /api/suppliers - Retrieve all suppliers
supplierRouter.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ created_at: -1 });
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving suppliers', error: error.message });
  }
});

// GET /api/suppliers/:supplierId - Retrieve a single supplier by ID
supplierRouter.get('/:supplierId', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.supplierId);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.status(200).json(supplier);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Error retrieving supplier', error: error.message });
  }
});

// PUT /api/suppliers/:supplierId - Update a supplier by ID
supplierRouter.put('/:supplierId', async (req, res) => {
  try {
     if (req.body.email) {
        const existingSupplier = await Supplier.findOne({ email: req.body.email, _id: { $ne: req.params.supplierId } });
        if (existingSupplier) {
            return res.status(409).json({ message: 'Email already in use by another supplier.' });
        }
    }
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.supplierId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedSupplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.status(200).json(updatedSupplier);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found (invalid ID format)' });
    }
     if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return res.status(409).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Error updating supplier', error: error.message });
  }
});

// DELETE /api/suppliers/:supplierId - Delete a supplier by ID
supplierRouter.delete('/:supplierId', async (req, res) => {
  try {
    const deletedSupplier = await Supplier.findByIdAndDelete(req.params.supplierId);
    if (!deletedSupplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Error deleting supplier', error: error.message });
  }
});

app.use('/api/suppliers', supplierRouter);

// Original root route (can be kept or removed)
app.get('/', (req, res) => {
  res.send('Hello World! This is the Store Management App Backend.');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
