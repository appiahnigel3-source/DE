import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'de_dark_luxury_jwt_secret_token_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), trimmedEmail, passwordHash, 'customer']
    );

    const newUser = {
      id: result.insertId,
      name: name.trim(),
      email: trimmedEmail,
      role: 'customer'
    };

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: newUser
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [trimmedEmail]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = generateToken(userData);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userData
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/profile
export async function getProfile(req, res, next) {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    next(error);
  }
}
