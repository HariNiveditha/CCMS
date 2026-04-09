const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();

// ✅ Create connection pool (better for performance)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ccms',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ✅ Check DB connection once
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ DB CONNECTION FAILED:", err);
  } else {
    console.log("✅ Connected to MySQL (localhost)");
    connection.release();
  }
});

// ✅ Debug (optional - remove later)
db.query("SELECT DATABASE()", (err, result) => {
  if (!err) console.log("📦 CURRENT DB:", result);
});

// =======================
// 🚀 SIGNUP
// =======================
router.post('/signup', async (req, res) => {
  const { roll_number, name, email, phone, password } = req.body;

  if (!roll_number || !name || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (roll_number, name, email, phone, password)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [roll_number, name, email, phone, hashedPassword], (err) => {
      if (err) {
        console.log("SIGNUP ERROR:", err);

        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({
            message: 'Roll number or email already exists'
          });
        }

        return res.status(500).json({ message: 'Database error' });
      }

      res.status(201).json({
        message: 'User registered successfully!'
      });
    });

  } catch (err) {
    console.log("HASH ERROR:", err);
    res.status(500).json({ message: 'Error hashing password' });
  }
});

// =======================
// 🔐 LOGIN
// =======================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.log("LOGIN ERROR:", err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    try {
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // ✅ Check admin role
      const adminQuery = `
        SELECT id, name 
        FROM clubs 
        WHERE admin_id = ?
      `;

      db.query(adminQuery, [user.id], (err, clubs) => {
        if (err) {
          console.log("ADMIN QUERY ERROR:", err);
          return res.status(500).json({ message: 'Database error' });
        }

        const role = clubs.length > 0 ? 'admin' : 'user';

        res.status(200).json({
          message: 'Login successful!',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: role,
            adminClubs: clubs
          }
        });
      });

    } catch (err) {
      console.log("BCRYPT ERROR:", err);
      res.status(500).json({ message: 'Error comparing password' });
    }
  });
});

module.exports = router;