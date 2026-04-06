const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all clubs (accessible by all logged-in users)
router.get('/', async (req, res) => {
  try {
    const [clubs] = await db.query('SELECT * FROM clubs ORDER BY created_at DESC');
    res.json({ success: true, data: clubs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET single club by ID
router.get('/:id', async (req, res) => {
  try {
    const [club] = await db.query('SELECT * FROM clubs WHERE id = ?', [req.params.id]);
    if (club.length === 0) return res.status(404).json({ success: false, message: 'Club not found' });
    res.json({ success: true, data: club[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST create a new club (admin only)
router.post('/', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Club name is required' });
  try {
    const [result] = await db.query(
      'INSERT INTO clubs (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    res.status(201).json({ success: true, message: 'Club created', clubId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT update a club (admin only)
router.put('/:id', async (req, res) => {
  const { name, description } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE clubs SET name = ?, description = ? WHERE id = ?',
      [name, description, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Club not found' });
    res.json({ success: true, message: 'Club updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE a club (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM clubs WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Club not found' });
    res.json({ success: true, message: 'Club deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;