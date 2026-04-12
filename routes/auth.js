const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
  const { name, email, password, phone, role, branch, year } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, role, branch, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, role || 'student', branch || null, year || null]
    );
    res.status(201).json({ success: true, message: 'User registered', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Admin rights are determined by clubs.admin_id mapping.
    const [clubs] = await db.query(
      'SELECT id, name FROM clubs WHERE admin_id = ? ORDER BY id ASC',
      [user.id]
    );

    const computedRole = clubs.length > 0 ? 'admin' : (user.role || 'student');

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: computedRole,
        adminClubs: clubs.map(c => ({
          id: c.id,
          name: c.name,
          recruitmentOpen: false,
          members: [],
          events: []
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET user profile by ID (admin only)
router.get('/user/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid user id' });
  }

  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.branch, u.year, u.role, u.created_at, u.updated_at,
              GROUP_CONCAT(c.name) as club_name
       FROM users u
       LEFT JOIN clubs c ON c.admin_id = u.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        branch: user.branch || 'Not Specified',
        year: user.year || 'Not Specified',
        role: user.role || 'student',
        club_name: user.club_name || 'Not Assigned',
        created_at: user.created_at,
        updated_at: user.updated_at,
        joined_at: user.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT update user profile by ID (admin only)
router.put('/user/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid user id' });
  }

  const { name, phone, branch, year } = req.body;

  // At least one field must be provided
  if (!name && !phone && !branch && !year) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  try {
    // Build dynamic update query
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (branch) {
      updates.push('branch = ?');
      values.push(branch);
    }
    if (year) {
      updates.push('year = ?');
      values.push(year);
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE user (admin only) - Removes user from database
router.delete('/user/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid user id' });
  }

  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT update user profile (Phase 2 - Self/User update)
router.put('/profile/update/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid user id' });
  }

  const { phone, roll_number, profile_completed } = req.body;

  try {
    // Build dynamic update query
    const updates = [];
    const values = [];

    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone || null);
    }
    if (roll_number !== undefined) {
      updates.push('roll_number = ?');
      values.push(roll_number || null);
    }
    if (profile_completed !== undefined) {
      updates.push('profile_completed = ?');
      values.push(profile_completed);
    }

    // Always update timestamp
    updates.push('updated_at = NOW()');
    values.push(userId);

    if (updates.length === 1) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// USER-SPECIFIC ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// GET user's clubs (clubs they are members of)
router.get('/users/:userId/clubs', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid user id' });
  }

  try {
    const [clubs] = await db.query(
      `SELECT c.id, c.name, c.description, c.admin_id, cm.role, cm.joined_date
       FROM clubs c
       JOIN club_members cm ON c.id = cm.club_id
       WHERE cm.user_id = ? AND cm.status = 'accepted'
       ORDER BY cm.joined_date DESC`,
      [userId]
    );

    res.json({ success: true, data: clubs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET user's join requests
router.get('/users/:userId/requests', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid user id' });
  }

  try {
    const [requests] = await db.query(
      `SELECT jr.id, jr.club_id, jr.status, jr.requested_at, jr.reviewed_at, c.name as club_name
       FROM join_requests jr
       JOIN clubs c ON c.id = jr.club_id
       WHERE jr.user_id = ?
       ORDER BY jr.requested_at DESC`,
      [userId]
    );

    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
