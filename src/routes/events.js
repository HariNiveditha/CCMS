const express = require('express');
const router = express.Router();
const db = require('../db');

function isToggleEnabled(row, camelKey, snakeKey) {
  const raw = row && row[camelKey] !== undefined
    ? row[camelKey]
    : row && row[snakeKey] !== undefined
      ? row[snakeKey]
      : null;

  if (raw === null || raw === undefined) return false;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw === 1;
  const normalized = String(raw).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'open';
}

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

// GET registrations for a specific event
router.get('/:id/registrations', async (req, res) => {
  try {
    const [registrations] = await db.query(
      'SELECT id, event_id, name, email, phone, roll_number, special_requirements, registered_at FROM event_registrations WHERE event_id = ? ORDER BY registered_at DESC',
      [req.params.id]
    );

    res.json({ success: true, data: registrations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ✅ GET check if user is registered for an event
// (must be before /:id)
router.get('/:id/check-registration', async (req, res) => {
  try {
    const email = req.query.email;
    const userId = req.query.userId;

    if (!email && !userId) return res.json({ registered: false });

    let resolvedEmail = email;
    if (!resolvedEmail && userId) {
      const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
      resolvedEmail = users.length > 0 ? users[0].email : null;
    }

    if (!resolvedEmail) return res.json({ registered: false });

    const [registration] = await db.query(
      'SELECT id FROM event_registrations WHERE event_id = ? AND email = ?',
      [req.params.id, resolvedEmail]
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
      SELECT e.*, c.name AS club_name, c.id AS club_id, c.*
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
    email,
    phone,
    roll_number,
    special_requirements,
    outcome_of_event
  } = req.body;

  if (!event_id || !name || !roll_number || !(special_requirements || outcome_of_event)) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    let resolvedEmail = email || null;
    let resolvedPhone = phone || null;

    const [eventRows] = await db.query(
      `SELECT e.id, e.club_id, c.*
       FROM events e
       LEFT JOIN clubs c ON c.id = e.club_id
       WHERE e.id = ?`,
      [event_id]
    );

    if (eventRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (eventRows[0].club_id && !isToggleEnabled(eventRows[0], 'eventRegistrationsOpen', 'event_registrations_open')) {
      return res.status(403).json({ success: false, message: 'Event registrations are currently closed for this club' });
    }

    if (!resolvedEmail && user_id) {
      const [users] = await db.query(
        'SELECT email, phone FROM users WHERE id = ?',
        [user_id]
      );

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      resolvedEmail = users[0].email;
      if (!resolvedPhone) {
        resolvedPhone = users[0].phone || null;
      }
    }

    if (!resolvedEmail) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if already registered
    const [existing] = await db.query(
      'SELECT id FROM event_registrations WHERE event_id = ? AND email = ?',
      [event_id, resolvedEmail]
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
      (event_id, name, email, phone, roll_number, special_requirements) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        event_id,
        name,
        resolvedEmail,
        resolvedPhone,
        roll_number,
        special_requirements || outcome_of_event || null
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