// server.js
const express = require('express');
const cors    = require('cors');
const mysql   = require('mysql2');
const path    = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const eventRoutes = require('./routes/events');
const clubRegistrationRoutes = require('./routes/club-registration');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'CCMS API is running',
    endpoints: [
      '/api/auth',
      '/api/clubs',
      '/api/events',
      '/api/club-register',
      '/api/admin/requests',
      '/api/admin/approve/:id',
      '/api/admin/reject/:id'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

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

  app.use('/api', clubRegistrationRoutes);

  app.get('/', (req, res) => {
    res.send('CCMS server is running');
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

// Export DB if routes need it
module.exports = db;
// create express server
// create middleware for error handling