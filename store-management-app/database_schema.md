# Database Schema for Store Management App

This document outlines the database schema for the Store Management Application.

## Table: Products

Stores information about the products available in the store.

| Column Name         | Data Type                     | Constraints                                             | Default Value          | Description                                   |
|---------------------|-------------------------------|---------------------------------------------------------|------------------------|-----------------------------------------------|
| `product_id`        | INTEGER                       | PRIMARY KEY, AUTOINCREMENT                              |                        | Unique identifier for the product             |
| `name`              | VARCHAR(255)                  | NOT NULL                                                |                        | Name of the product                           |
| `description`       | TEXT                          |                                                         |                        | Detailed description of the product           |
| `price`             | DECIMAL(10, 2)                | NOT NULL                                                |                        | Price of the product                          |
| `image_url`         | VARCHAR(2048)                 |                                                         |                        | URL of the product image                      |
| `category`          | VARCHAR(100)                  |                                                         |                        | Category of the product (e.g., Electronics)   |
| `created_at`        | TIMESTAMP                     |                                                         | CURRENT_TIMESTAMP      | Timestamp of product creation                 |
| `updated_at`        | TIMESTAMP                     |                                                         | CURRENT_TIMESTAMP      | Timestamp of last product update (updates on change) |

*Note: `updated_at` is typically handled by database triggers or application logic to automatically update on row modification.*

## Table: Inventory

Tracks the stock levels of products.

| Column Name           | Data Type     | Constraints                                             | Default Value     | Description                                       |
|-----------------------|---------------|---------------------------------------------------------|-------------------|---------------------------------------------------|
| `inventory_id`      | INTEGER       | PRIMARY KEY, AUTOINCREMENT                              |                   | Unique identifier for the inventory record        |
| `product_id`        | INTEGER       | NOT NULL, FOREIGN KEY (`product_id`) REFERENCES `Products`(`product_id`) |                   | Foreign key linking to the `Products` table     |
| `quantity`          | INTEGER       | NOT NULL                                                | 0                 | Current quantity of the product in stock          |
| `last_stocked_date` | TIMESTAMP     |                                                         | CURRENT_TIMESTAMP | Date when the product was last stocked            |
| `low_stock_threshold` | INTEGER       |                                                         | 10                | Threshold at which stock is considered low        |

## Table: Customers

Stores information about customers.

| Column Name   | Data Type       | Constraints                               | Default Value     | Description                             |
|---------------|-----------------|-------------------------------------------|-------------------|-----------------------------------------|
| `customer_id` | INTEGER         | PRIMARY KEY, AUTOINCREMENT                |                   | Unique identifier for the customer      |
| `first_name`  | VARCHAR(100)    | NOT NULL                                  |                   | Customer's first name                   |
| `last_name`   | VARCHAR(100)    | NOT NULL                                  |                   | Customer's last name                    |
| `email`       | VARCHAR(255)    | NOT NULL, UNIQUE                          |                   | Customer's email address                |
| `phone`       | VARCHAR(20)     |                                           |                   | Customer's phone number                 |
| `address`     | TEXT            |                                           |                   | Customer's physical address             |
| `created_at`  | TIMESTAMP       |                                           | CURRENT_TIMESTAMP | Timestamp of customer record creation   |

## Table: Suppliers

Stores information about product suppliers.

| Column Name      | Data Type       | Constraints                               | Default Value     | Description                               |
|------------------|-----------------|-------------------------------------------|-------------------|-------------------------------------------|
| `supplier_id`    | INTEGER         | PRIMARY KEY, AUTOINCREMENT                |                   | Unique identifier for the supplier        |
| `name`           | VARCHAR(255)    | NOT NULL                                  |                   | Name of the supplier company              |
| `contact_person` | VARCHAR(150)    |                                           |                   | Main contact person at the supplier       |
| `email`          | VARCHAR(255)    | NOT NULL, UNIQUE                          |                   | Supplier's email address                  |
| `phone`          | VARCHAR(20)     |                                           |                   | Supplier's phone number                   |
| `address`        | TEXT            |                                           |                   | Supplier's physical address               |
| `created_at`     | TIMESTAMP       |                                           | CURRENT_TIMESTAMP | Timestamp of supplier record creation     |

## Table: Orders

Stores information about customer orders.

| Column Name        | Data Type                     | Constraints                                                | Default Value     | Description                                           |
|--------------------|-------------------------------|------------------------------------------------------------|-------------------|-------------------------------------------------------|
| `order_id`         | INTEGER                       | PRIMARY KEY, AUTOINCREMENT                                 |                   | Unique identifier for the order                       |
| `customer_id`      | INTEGER                       | NOT NULL, FOREIGN KEY (`customer_id`) REFERENCES `Customers`(`customer_id`) |                   | Foreign key linking to the `Customers` table          |
| `order_date`       | TIMESTAMP                     |                                                            | CURRENT_TIMESTAMP | Date and time when the order was placed               |
| `total_amount`     | DECIMAL(12, 2)                | NOT NULL                                                   |                   | Total amount for the order                            |
| `status`           | VARCHAR(50)                   |                                                            | 'Pending'         | Current status of the order (e.g., Pending, Shipped)  |
| `shipping_address` | TEXT                          |                                                            |                   | Address where the order will be shipped               |
| `billing_address`  | TEXT                          |                                                            |                   | Address for billing purposes                          |

## Table: Order_Items

Stores details of individual items within each order (a junction table for Orders and Products).

| Column Name       | Data Type       | Constraints                                                                 | Default Value | Description                                      |
|-------------------|-----------------|-----------------------------------------------------------------------------|---------------|--------------------------------------------------|
| `order_item_id` | INTEGER         | PRIMARY KEY, AUTOINCREMENT                                                  |               | Unique identifier for the order item             |
| `order_id`      | INTEGER         | NOT NULL, FOREIGN KEY (`order_id`) REFERENCES `Orders`(`order_id`)          |               | Foreign key linking to the `Orders` table        |
| `product_id`    | INTEGER         | NOT NULL, FOREIGN KEY (`product_id`) REFERENCES `Products`(`product_id`)    |               | Foreign key linking to the `Products` table      |
| `quantity`      | INTEGER         | NOT NULL                                                                    |               | Quantity of the product ordered                  |
| `price_per_unit`| DECIMAL(10, 2)  | NOT NULL                                                                    |               | Price of the product at the time of the order    |
