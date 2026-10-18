import pool from '../config/db.js';

// GET /api/wishlist
export async function getWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const [items] = await pool.query(
      `SELECT w.id as wishlist_id, p.* 
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      wishlist: items
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/wishlist/toggle
export async function toggleWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'product_id is required.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, product_id]);
      return res.json({ success: true, saved: false, message: 'Removed from wishlist.' });
    } else {
      await pool.query('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [userId, product_id]);
      return res.json({ success: true, saved: true, message: 'Saved to wishlist.' });
    }
  } catch (error) {
    next(error);
  }
}
