import pool from '../config/db.js';

// Helper to generate a URL-friendly slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// GET /api/products
export async function getProducts(req, res, next) {
  try {
    const { category, search, sort, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM products WHERE is_active = 1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim()) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR badge LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (sort === 'price_asc') {
      sql += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY price DESC';
    } else {
      sql += ' ORDER BY id ASC';
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(sql, params);
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products/:id
export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/products (Admin)
export async function createProduct(req, res, next) {
  try {
    const { name, description, price, badge = 'NEW', category, image_url, stock = 50 } = req.body;

    if (!name || price === undefined || !category || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, category, and image_url are required.'
      });
    }

    const slug = slugify(name) + '-' + Date.now().toString().slice(-4);

    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, price, badge, category, image_url, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description || '', parseFloat(price), badge, category.toLowerCase(), image_url, parseInt(stock, 10)]
    );

    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: newProduct[0]
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/products/:id (Admin)
export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, price, badge, category, image_url, stock, is_active } = req.body;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await pool.query(
      `UPDATE products SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        badge = COALESCE(?, badge),
        category = COALESCE(?, category),
        image_url = COALESCE(?, image_url),
        stock = COALESCE(?, stock),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        name,
        description,
        price !== undefined ? parseFloat(price) : null,
        badge,
        category ? category.toLowerCase() : null,
        image_url,
        stock !== undefined ? parseInt(stock, 10) : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/products/:id (Admin)
export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}
