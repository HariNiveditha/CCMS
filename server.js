// server.js
const express = require('express');
const cors    = require('cors');
const mysql   = require('mysql2');
const path    = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const eventRoutes = require('./routes/events');

const app = express();

app.use(cors());
app.use(express.json());

// ── Serve Frontend static files ───────────────────────────────────────────────
// Access pages at: http://localhost:3000/clubs.html, /login.html etc.
app.use(express.static(path.join(__dirname, 'Frontend')));

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ccms'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:');
    console.error(err);
    process.exit(1);
  }

  console.log('✅ MySQL connected successfully');

  // Start server only after DB connects
  const PORT = process.env.PORT || 3000;

  app.use('/api/auth', authRoutes);
  app.use('/api/clubs', clubRoutes);
  app.use('/api/events', eventRoutes);

  app.get('/', (req, res) => {
    res.send('CCMS server is running');
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

// Export DB if routes need it
module.exports = db;