import pool from '../config/db.js';

// GET /api/categories
export async function getCategories(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}
