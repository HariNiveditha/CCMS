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
    const email = req.query.email;
    if (!email) return res.json({ registered: false });

    const [registration] = await db.query(
      'SELECT id FROM event_registrations WHERE event_id = ? AND email = ?',
      [req.params.id, email]
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
  const { event_id, name, email, phone, roll_number, special_requirements } = req.body;

  if (!event_id || !name || !email || !phone || !roll_number) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
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
      'SELECT id FROM event_registrations WHERE event_id = ? AND email = ?',
      [event_id, email]
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
      [event_id, name, email, phone, roll_number, special_requirements || null]
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