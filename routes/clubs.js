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

// GET user's joined clubs by email
router.get('/user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // Get clubs where user is a direct member
    const [clubs] = await db.query(`
      SELECT DISTINCT c.id, c.name, c.description
      FROM clubs c
      JOIN club_members cm ON c.id = cm.club_id
      JOIN users u ON cm.user_id = u.id
      WHERE u.email = ?
      ORDER BY c.name ASC
    `, [email]);

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

// POST join a club (user joins a club)
router.post('/:clubId/join', async (req, res) => {
  const { email } = req.body;
  
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  
  try {
    // Get user ID from email
    const [users] = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userId = users[0].id;
    const userName = users[0].name;
    const clubId = req.params.clubId;

    // Check if club exists and recruitment is open
    const [clubs] = await db.query(
      'SELECT id, recruitmentOpen FROM clubs WHERE id = ?',
      [clubId]
    );
    if (clubs.length === 0) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    if (!clubs[0].recruitmentOpen) {
      return res.status(403).json({ 
        success: false, 
        message: 'This club is not open for recruitment' 
      });
    }

    // Check if already applied
    const [existing] = await db.query(
      'SELECT id, status FROM club_applications WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: `You have already applied (Status: ${existing[0].status})` 
      });
    }

    // Create application
    await db.query(
      'INSERT INTO club_applications (club_id, user_id, email, name, status) VALUES (?, ?, ?, ?, ?)',
      [clubId, userId, email, userName, 'pending']
    );

    res.status(201).json({ 
      success: true, 
      message: 'Application submitted! Admins will review your request.' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE leave a club (user leaves a club) - NOT USED, only admins can remove
router.post('/:clubId/leave', async (req, res) => {
  return res.status(403).json({ 
    success: false, 
    message: 'Users cannot leave clubs. Contact club admin.' 
  });
});

// ========== ADMIN ENDPOINTS ==========

// GET all applications for a club (admin only)
router.get('/:clubId/applications', async (req, res) => {
  try {
    const clubId = req.params.clubId;

    const [applications] = await db.query(`
      SELECT ca.id, ca.user_id, ca.name, ca.email, ca.status, ca.applied_at
      FROM club_applications ca
      WHERE ca.club_id = ?
      ORDER BY ca.applied_at DESC
    `, [clubId]);

    res.json({ success: true, data: applications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST approve an application (admin only)
router.post('/applications/:appId/approve', async (req, res) => {
  try {
    const appId = req.params.appId;
    const adminId = req.body.adminId; // Should come from auth middleware

    // Get application details
    const [apps] = await db.query(
      'SELECT club_id, user_id, status FROM club_applications WHERE id = ?',
      [appId]
    );
    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = apps[0];
    if (app.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Application already ${app.status}` 
      });
    }

    // Add user to club_members
    await db.query(
      'INSERT IGNORE INTO club_members (club_id, user_id) VALUES (?, ?)',
      [app.club_id, app.user_id]
    );

    // Update application status
    await db.query(
      'UPDATE club_applications SET status = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?',
      ['approved', adminId || null, appId]
    );

    res.json({ success: true, message: 'Application approved!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST reject an application (admin only)
router.post('/applications/:appId/reject', async (req, res) => {
  try {
    const appId = req.params.appId;
    const adminId = req.body.adminId;

    // Get application details
    const [apps] = await db.query(
      'SELECT status FROM club_applications WHERE id = ?',
      [appId]
    );
    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (apps[0].status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Application already ${apps[0].status}` 
      });
    }

    // Update application status
    await db.query(
      'UPDATE club_applications SET status = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?',
      ['rejected', adminId || null, appId]
    );

    res.json({ success: true, message: 'Application rejected!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST remove a member from club (admin only)
router.post('/:clubId/members/:userId/remove', async (req, res) => {
  try {
    const { clubId, userId } = req.params;

    const [result] = await db.query(
      'DELETE FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({ success: true, message: 'Member removed from club' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT toggle recruitment status (admin only)
router.put('/:clubId/recruitment', async (req, res) => {
  try {
    const { clubId } = req.params;
    const { recruitmentOpen } = req.body;

    if (recruitmentOpen === undefined) {
      return res.status(400).json({ success: false, message: 'recruitmentOpen is required' });
    }

    const [result] = await db.query(
      'UPDATE clubs SET recruitmentOpen = ? WHERE id = ?',
      [recruitmentOpen ? 1 : 0, clubId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    res.json({ 
      success: true, 
      message: recruitmentOpen ? 'Recruitment opened!' : 'Recruitment closed!' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;