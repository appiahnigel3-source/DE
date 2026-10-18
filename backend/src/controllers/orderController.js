import pool from '../config/db.js';

// Helper to generate order number
function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `DE-${dateStr}-${randomStr}`;
}

// POST /api/orders (Guest or Authenticated Customer)
export async function createOrder(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const {
      customer_name,
      customer_email,
      phone,
      shipping_address,
      city,
      postal_code,
      items
    } = req.body;

    if (!customer_name || !customer_email || !shipping_address || !city || !postal_code) {
      return res.status(400).json({
        success: false,
        message: 'Shipping name, email, address, city, and postal code are required.'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one product item.'
      });
    }

    await connection.beginTransaction();

    // Fetch verified prices and details from products table
    let calculatedTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const productId = item.productId || item.id;
      const qty = parseInt(item.quantity || 1, 10);

      const [productRows] = await connection.query(
        'SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );

      if (productRows.length === 0) {
        throw new Error(`Product with ID ${productId} was not found.`);
      }

      const product = productRows[0];
      const itemPrice = parseFloat(product.price);
      const lineTotal = itemPrice * qty;
      calculatedTotal += lineTotal;

      verifiedItems.push({
        product_id: product.id,
        product_name: product.name,
        price: itemPrice,
        quantity: qty,
        total_price: lineTotal
      });

      // Update product stock
      const newStock = Math.max(0, product.stock - qty);
      await connection.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, product.id]);
    }

    const orderNumber = generateOrderNumber();
    const userId = req.user ? req.user.id : null;

    // Insert order record
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, phone,
        shipping_address, city, postal_code, total_amount, payment_status, order_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'pending')`,
      [
        orderNumber,
        userId,
        customer_name.trim(),
        customer_email.toLowerCase().trim(),
        phone ? phone.trim() : null,
        shipping_address.trim(),
        city.trim(),
        postal_code.trim(),
        calculatedTotal
      ]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const vItem of verifiedItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, vItem.product_id, vItem.product_name, vItem.price, vItem.quantity, vItem.total_price]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order: {
        id: orderId,
        order_number: orderNumber,
        total_amount: calculatedTotal,
        customer_name,
        customer_email,
        items: verifiedItems
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// GET /api/orders/my (Customer orders)
export async function getMyOrders(req, res, next) {
  try {
    const userId = req.user.id;
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/orders (Admin - all orders)
export async function getAllOrders(req, res, next) {
  try {
    const [orders] = await pool.query(
      `SELECT * FROM orders ORDER BY created_at DESC`
    );

    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/orders/:id/status (Admin)
export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
      });
    }

    const [result] = await pool.query(
      'UPDATE orders SET order_status = ? WHERE id = ?',
      [order_status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({
      success: true,
      message: `Order status updated to '${order_status}'.`
    });
  } catch (error) {
    next(error);
  }
}
