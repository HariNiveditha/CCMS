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

// GET clubs managed by a specific admin
router.get('/admin/:adminId', async (req, res) => {
  const adminId = Number(req.params.adminId);
  if (!Number.isInteger(adminId) || adminId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid admin id' });
  }

  try {
    const [clubs] = await db.query(
      'SELECT id, name, description, admin_id, recruitmentOpen, created_at FROM clubs WHERE admin_id = ? ORDER BY created_at DESC',
      [adminId]
    );
    res.json({ success: true, data: clubs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// SPECIFIC ROUTES (must come BEFORE generic /:id routes)
// ════════════════════════════════════════════════════════════════════════════════

// POST user requests to join a club
router.post('/:clubId/request-join', async (req, res) => {
  const clubId = Number(req.params.clubId);
  const { userId, name, branch, rollNumber, year, role, interestGoals } = req.body;

  if (!Number.isInteger(clubId) || clubId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid club id' });
  }

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  if (!name || !branch || !rollNumber || !year || !role || !interestGoals) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (!['Coordinator', 'Member'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be Coordinator or Member' });
  }

  try {
    // Check if already a member
    const [member] = await db.query(
      'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );

    if (member.length > 0) {
      return res.status(409).json({ success: false, message: 'User is already a member' });
    }

    // Check if already requested
    const [existing] = await db.query(
      'SELECT id FROM join_requests WHERE club_id = ? AND user_id = ? AND status = "pending"',
      [clubId, userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'You have already requested to join' });
    }

    // Update user profile with year, branch, and roll number if provided
    if (year || branch || rollNumber) {
      const updates = [];
      const values = [];

      if (year) {
        updates.push('year = ?');
        values.push(year);
      }
      if (branch) {
        updates.push('branch = ?');
        values.push(branch);
      }
      if (rollNumber) {
        updates.push('roll_number = ?');
        values.push(rollNumber);
      }
      
      if (updates.length > 0) {
        values.push(userId);
        await db.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }
    }

    // Create join request with detailed information
    const [result] = await db.query(
      `INSERT INTO join_requests 
       (club_id, user_id, name, branch, roll_number, year, role, interest_goals, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clubId, userId, name, branch, rollNumber, year, role, interestGoals, 'pending']
    );

    res.status(201).json({
      success: true,
      message: 'Join request submitted successfully',
      requestId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET join requests for a specific club
router.get('/:clubId/requests', async (req, res) => {
  const clubId = Number(req.params.clubId);
  if (!Number.isInteger(clubId) || clubId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid club id' });
  }

  try {
    const [requests] = await db.query(
      `SELECT 
        jr.id,
        jr.club_id,
        jr.user_id,
        jr.status,
        jr.requested_at,
        u.name as user_name,
        u.branch,
        u.year,
        u.roll_number,
        jr.name,
        jr.branch as requested_branch,
        jr.roll_number as requested_roll_number,
        jr.year as requested_year,
        jr.role,
        jr.interest_goals
       FROM join_requests jr
       JOIN users u ON u.id = jr.user_id
       WHERE jr.club_id = ?
       ORDER BY jr.status, jr.requested_at DESC`,
      [clubId]
    );

    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT approve/reject join request
router.put('/requests/:requestId/status', async (req, res) => {
  const requestId = Number(req.params.requestId);
  const { status } = req.body;

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid request id' });
  }

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be accepted or rejected' });
  }

  try {
    // Get the join request details
    const [requests] = await db.query(
      'SELECT club_id, user_id FROM join_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Join request not found' });
    }

    const { club_id, user_id } = requests[0];

    // If accepting, add user to club_members
    if (status === 'accepted') {
      const [existing] = await db.query(
        'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?',
        [club_id, user_id]
      );

      if (existing.length === 0) {
        await db.query(
          'INSERT INTO club_members (club_id, user_id, role, status) VALUES (?, ?, ?, ?)',
          [club_id, user_id, 'member', 'accepted']
        );
      }
    }

    // Update request status
    const [result] = await db.query(
      'UPDATE join_requests SET status = ?, reviewed_at = NOW() WHERE id = ?',
      [status, requestId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({
      success: true,
      message: `Join request ${status}`,
      status: status
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE cancel/remove join request
router.delete('/requests/:requestId', async (req, res) => {
  const requestId = Number(req.params.requestId);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid request id' });
  }

  try {
    // Get request details before deleting
    const [requests] = await db.query(
      'SELECT club_id FROM join_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Delete the request
    await db.query('DELETE FROM join_requests WHERE id = ?', [requestId]);

    res.json({ success: true, message: 'Request cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// GENERIC ROUTES (must come AFTER specific routes)
// ════════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// CLUB MEMBERS ENDPOINTS (OPTION 2)
// ═══════════════════════════════════════════════════════════════

// GET all members of a specific club
router.get('/:clubId/members', async (req, res) => {
  const clubId = Number(req.params.clubId);
  if (!Number.isInteger(clubId) || clubId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid club id' });
  }

  try {
    const [members] = await db.query(
      `SELECT 
        cm.id, 
        cm.club_id, 
        cm.user_id, 
        u.name, 
        u.email, 
        u.branch, 
        u.year, 
        u.phone, 
        u.roll_number,
        cm.role, 
        cm.status, 
        cm.joined_date
       FROM club_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.club_id = ? AND cm.status = 'accepted'
       ORDER BY cm.joined_date DESC`,
      [clubId]
    );

    res.json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET available users (registered users NOT in this club)
router.get('/:clubId/available-users', async (req, res) => {
  const clubId = Number(req.params.clubId);
  if (!Number.isInteger(clubId) || clubId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid club id' });
  }

  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.branch, u.year, u.phone, u.roll_number
       FROM users u
       WHERE u.id NOT IN (
         SELECT user_id FROM club_members WHERE club_id = ?
       )
       AND u.role = 'student'
       ORDER BY u.name ASC`,
      [clubId]
    );

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST add user to club as member
router.post('/:clubId/add-member', async (req, res) => {
  const clubId = Number(req.params.clubId);
  const { userId } = req.body;

  if (!Number.isInteger(clubId) || clubId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid club id' });
  }

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    // Check if user already a member
    const [existing] = await db.query(
      'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'User is already a member' });
    }

    // Add user to club
    const [result] = await db.query(
      'INSERT INTO club_members (club_id, user_id, role, status) VALUES (?, ?, ?, ?)',
      [clubId, userId, 'member', 'accepted']
    );

    res.status(201).json({ 
      success: true, 
      message: 'Member added successfully',
      membershipId: result.insertId 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE remove user from club
router.delete('/:clubId/members/:userId', async (req, res) => {
  const clubId = Number(req.params.clubId);
  const userId = Number(req.params.userId);

  if (!Number.isInteger(clubId) || clubId <= 0 || !Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid club id or user id' });
  }

  try {
    const [result] = await db.query(
      'DELETE FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT toggle recruitment status (admin only)
router.put('/:clubId/recruitment', async (req, res) => {
  try {
    const clubId = req.params.clubId;
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
      message: recruitmentOpen ? '✅ Recruitment opened!' : '✅ Recruitment closed!' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// JOIN REQUEST ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// GET all pending join requests for clubs managed by this admin
router.get('/requests/admin/:adminId', async (req, res) => {
  const adminId = Number(req.params.adminId);
  if (!Number.isInteger(adminId) || adminId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid admin id' });
  }

  try {
    const [requests] = await db.query(
      `SELECT 
        jr.id,
        jr.club_id,
        jr.user_id,
        jr.status,
        jr.requested_at,
        c.name as club_name,
        u.name as user_name,
        u.email as user_email,
        u.branch,
        u.year
       FROM join_requests jr
       JOIN clubs c ON c.id = jr.club_id
       JOIN users u ON u.id = jr.user_id
       WHERE c.admin_id = ?
       ORDER BY jr.requested_at DESC`,
      [adminId]
    );

    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
// get clubs by admin id