import pool from '../config/db.js';

// POST /api/contact
export async function submitContactMessage(req, res, next) {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), subject ? subject.trim() : null, message.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Your inquiry has been received. Our concierge team will be in touch shortly.'
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/contact (Admin)
export async function getContactMessages(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({
      success: true,
      count: rows.length,
      messages: rows
    });
  } catch (error) {
    next(error);
  }
}
