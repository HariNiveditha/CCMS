const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all events
router.get('/', async (req, res) => {
  try {
    const [events] = await db.query(`
      SELECT e.*, c.name AS club_name 
      FROM events e 
      LEFT JOIN clubs c ON e.club_id = c.id 
      ORDER BY e.date ASC
    `);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ✅ GET all events for a specific club
// (must be before /:id)
router.get('/club/:clubId', async (req, res) => {
  try {
    const [events] = await db.query(
      'SELECT * FROM events WHERE club_id = ? ORDER BY date ASC',
      [req.params.clubId]
    );
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ✅ GET check if user is registered for an event
// (must be before /:id)
router.get('/:id/check-registration', async (req, res) => {
  try {
    const userId = req.query.userId;
    const email = req.query.email;

    if (!userId && !email) return res.json({ registered: false });

    const conditions = [];
    const values = [req.params.id];

    if (userId) {
      conditions.push('user_id = ?');
      values.push(userId);
    }

    if (email) {
      conditions.push('email = ?');
      values.push(email);
    }

    const [registration] = await db.query(
      `SELECT id FROM event_registrations WHERE event_id = ? AND (${conditions.join(' OR ')})`,
      values
    );

    res.json({ registered: registration.length > 0 });
  } catch (err) {
    res.json({ registered: false });
  }
});

// GET single event by ID
router.get('/:id', async (req, res) => {
  try {
    const [event] = await db.query(`
      SELECT e.*, c.name AS club_name 
      FROM events e 
      LEFT JOIN clubs c ON e.club_id = c.id 
      WHERE e.id = ?
    `, [req.params.id]);

    if (event.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, data: event[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST create a new event
router.post('/', async (req, res) => {
  const { club_id, title, description, date, location } = req.body;

  if (!title || !date) {
    return res.status(400).json({ success: false, message: 'Title and date are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO events (club_id, title, description, date, location) VALUES (?, ?, ?, ?, ?)',
      [club_id || null, title, description || null, date, location || null]
    );

    res.status(201).json({
      success: true,
      message: 'Event created',
      eventId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT update an event
router.put('/:id', async (req, res) => {
  const { club_id, title, description, date, location } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE events SET club_id = ?, title = ?, description = ?, date = ?, location = ? WHERE id = ?',
      [club_id, title, description, date, location, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, message: 'Event updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE an event
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM events WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST register a user for an event
router.post('/register', async (req, res) => {
  const {
    event_id,
    user_id,
    name,
    roll_number,
    event_name,
    location,
    branch,
    year,
    outcome_of_event
  } = req.body;

  if (!event_id || !user_id || !name || !roll_number || !event_name || !location || !branch || !year || !outcome_of_event) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const [users] = await db.query(
      'SELECT id, email, phone FROM users WHERE id = ?',
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];

    // Check if event exists
    const [event] = await db.query(
      'SELECT id FROM events WHERE id = ?',
      [event_id]
    );

    if (event.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if already registered
    const [existing] = await db.query(
      'SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [event_id, user_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Insert registration
    const [result] = await db.query(
      `INSERT INTO event_registrations 
      (event_id, user_id, name, email, phone, roll_number, event_name, event_location, branch, year, outcome_of_event) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_id,
        user_id,
        name,
        user.email || null,
        user.phone || null,
        roll_number,
        event_name,
        location,
        branch,
        year,
        outcome_of_event
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      registrationId: result.insertId
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;