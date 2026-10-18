-- DE Dark Luxury Clothing Store Database Schema
CREATE DATABASE IF NOT EXISTS de_clothing_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE de_clothing_store;

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NULL,
  price DECIMAL(10, 2) NOT NULL,
  badge VARCHAR(50) DEFAULT 'NEW',
  category VARCHAR(50) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  stock INT NOT NULL DEFAULT 50,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_price (price)
) ENGINE=InnoDB;

-- 3. Users Table (Customers and Admins)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(191) NOT NULL,
  phone VARCHAR(50) NULL,
  shipping_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(30) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'card',
  payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'paid',
  order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_number (order_number),
  INDEX idx_customer_email (customer_email)
) ENGINE=InnoDB;

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Wishlist Table
CREATE TABLE IF NOT EXISTS wishlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Contact Inquiries Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL,
  subject VARCHAR(200) NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed Categories
INSERT IGNORE INTO categories (name, slug, image_url) VALUES
('Men', 'men', 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=85'),
('Women', 'women', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85'),
('Accessories', 'accessories', 'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=900&q=85'),
('Essentials', 'essentials', 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85');

-- Seed Products
INSERT IGNORE INTO products (id, name, slug, description, price, badge, category, image_url, stock) VALUES
(1, 'DE Signature Hoodie', 'de-signature-hoodie', 'Heavyweight 480GSM French terry cotton hoodie with embroidered tone-on-tone DE insignia.', 79.99, 'NEW', 'men', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85', 40),
(2, 'DE Premium Tee', 'de-premium-tee', 'Silky mercerized organic cotton boxy fit tee with reinforced rib collar.', 49.99, 'NEW', 'men', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', 65),
(3, 'DE Cargo Pants', 'de-cargo-pants', 'Tactical tailored cargo trousers with waterproof matte hardware and adjustable cuffs.', 79.99, '-20%', 'men', 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=900&q=85', 30),
(4, 'DE Minimal Hoodie', 'de-minimal-hoodie', 'Oversized fleece silhouette engineered for subtle luxury and supreme comfort.', 74.99, 'NEW', 'women', 'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=900&q=85', 45),
(5, 'DE Varsity Jacket', 'de-varsity-jacket', 'Wool body with vegan leather sleeves, ribbed hem and custom gunmetal snap closures.', 109.99, '-15%', 'men', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85', 20),
(6, 'DE Classic Cap', 'de-classic-cap', 'Structured 6-panel curve-brim cap with metallic rear closure buckle.', 29.99, 'NEW', 'accessories', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85', 90),
(7, 'DE Sculpted Blazer', 'de-sculpted-blazer', 'Single-breasted architectural blazer with clean drop lapels and satin interior lining.', 119.99, 'NEW', 'women', 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=85', 18),
(8, 'DE Leather Carryall', 'de-leather-carryall', 'Full-grain textured leather duffle with solid brass hardware and detachable shoulder strap.', 89.99, 'LIMITED', 'accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', 15);
