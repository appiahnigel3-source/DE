import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'de_clothing_store',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

// Test connection function
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[MySQL] Connected successfully to database: ${process.env.DB_NAME || 'de_clothing_store'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[MySQL] Database connection failed:', error.message);
    return false;
  }
}

export default pool;
