import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'de_clothing_store';

  console.log(`\n======================================================`);
  console.log(`   DE Clothing Store — MySQL Database Setup`);
  console.log(`======================================================`);
  console.log(`Connecting to MySQL host: ${host}:${port} as user '${user}'...`);

  let connection;
  try {
    // 1. Connect to MySQL without specifying a database first
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log('✔ Connected to MySQL Server successfully.');

    // 2. Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`✔ Executing database schema from ${schemaPath}...`);
    await connection.query(schemaSql);
    console.log(`✔ Database '${database}' and tables created or verified successfully.`);

    // 3. Check and create default admin account
    await connection.changeUser({ database });
    const [existingAdmin] = await connection.query(
      `SELECT id FROM users WHERE email = ?`,
      ['admin@declothing.com']
    );

    if (existingAdmin.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('AdminPassword123!', salt);

      await connection.query(
        `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
        ['DE Admin', 'admin@declothing.com', hashedPassword, 'admin']
      );
      console.log('✔ Default Admin account created:');
      console.log('   Email:    admin@declothing.com');
      console.log('   Password: AdminPassword123!');
    } else {
      console.log('✔ Admin account already exists (admin@declothing.com).');
    }

    // 4. Verify product count
    const [products] = await connection.query(`SELECT COUNT(*) as count FROM products`);
    console.log(`✔ Products in catalog: ${products[0].count}`);

    console.log(`======================================================`);
    console.log(`  Database initialization completed successfully!`);
    console.log(`======================================================\n`);
    process.exit(0);
  } catch (error) {
    console.error('\n✖ Database initialization failed:');
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(`  Access denied for user '${user}'. Please check DB_USER and DB_PASSWORD in backend/.env`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`  Could not connect to MySQL at ${host}:${port}. Please verify MySQL service is running.`);
    } else {
      console.error(`  ${error.message}`);
    }
    console.error('\nPlease update backend/.env with your MySQL credentials and re-run: npm run init-db\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();
