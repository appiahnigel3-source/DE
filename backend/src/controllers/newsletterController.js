import pool from '../config/db.js';

// POST /api/newsletter/subscribe
export async function subscribeNewsletter(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }

    const trimmedEmail = email.toLowerCase().trim();

    const [existing] = await pool.query('SELECT id FROM newsletter_subscribers WHERE email = ?', [trimmedEmail]);
    if (existing.length > 0) {
      return res.json({ success: true, message: 'You are already subscribed to the DE exclusive list!' });
    }

    await pool.query('INSERT INTO newsletter_subscribers (email) VALUES (?)', [trimmedEmail]);

    res.status(201).json({
      success: true,
      message: 'Welcome to the DE exclusive circle.'
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/newsletter/subscribers (Admin)
export async function getSubscribers(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC');
    res.json({
      success: true,
      count: rows.length,
      subscribers: rows
    });
  } catch (error) {
    next(error);
  }
}
