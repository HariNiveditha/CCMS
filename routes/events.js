const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all events (accessible by all logged-in users)
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

// GET single event by ID
router.get('/:id', async (req, res) => {
  try {
    const [event] = await db.query(`
      SELECT e.*, c.name AS club_name 
      FROM events e 
      LEFT JOIN clubs c ON e.club_id = c.id 
      WHERE e.id = ?
    `, [req.params.id]);
    if (event.length === 0) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET all events for a specific club
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

// POST create a new event (admin only)
router.post('/', async (req, res) => {
  const { club_id, title, description, date, location } = req.body;
  if (!title || !date) return res.status(400).json({ success: false, message: 'Title and date are required' });
  try {
    const [result] = await db.query(
      'INSERT INTO events (club_id, title, description, date, location) VALUES (?, ?, ?, ?, ?)',
      [club_id || null, title, description || null, date, location || null]
    );
    res.status(201).json({ success: true, message: 'Event created', eventId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT update an event (admin only)
router.put('/:id', async (req, res) => {
  const { club_id, title, description, date, location } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE events SET club_id = ?, title = ?, description = ?, date = ?, location = ? WHERE id = ?',
      [club_id, title, description, date, location, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE an event (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;