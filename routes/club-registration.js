const express = require('express');
const router = express.Router();
const db = require('../db');

function isPositiveInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

function normalizeMemberRole(role) {
  return String(role || '').toLowerCase() === 'coordinator' ? 'coordinator' : 'member';
}

// POST /api/club-register
// Save club registration request as pending.
router.post('/club-register', async (req, res) => {
  const {
    clubId,
    userId,
    name,
    branch,
    rollNumber,
    year,
    role,
    interestGoals
  } = req.body;

  if (!isPositiveInt(clubId) || !isPositiveInt(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid clubId or userId' });
  }

  if (!name || !branch || !rollNumber || !year || !role || !interestGoals) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (!['Coordinator', 'Member'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be Coordinator or Member' });
  }

  try {
    const [member] = await db.query(
      'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );

    if (member.length > 0) {
      return res.status(409).json({ success: false, message: 'User is already a member of this club' });
    }

    const [existingRequest] = await db.query(
      'SELECT id FROM join_requests WHERE club_id = ? AND user_id = ? AND status = "pending"',
      [clubId, userId]
    );

    if (existingRequest.length > 0) {
      return res.status(409).json({ success: false, message: 'A pending request already exists for this club' });
    }

    await db.query(
      'UPDATE users SET branch = ?, year = ?, roll_number = ? WHERE id = ?',
      [branch, year, rollNumber, userId]
    );

    const [result] = await db.query(
      `INSERT INTO join_requests
       (club_id, user_id, name, branch, roll_number, year, role, interest_goals, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [clubId, userId, name, branch, rollNumber, year, role, interestGoals]
    );

    return res.status(201).json({
      success: true,
      message: 'Club registration submitted and pending approval',
      requestId: result.insertId,
      status: 'pending'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/admin/requests?adminId=1
// Admin sees all pending requests with full applicant details.
router.get('/admin/requests', async (req, res) => {
  const adminId = Number(req.query.adminId);

  if (!isPositiveInt(adminId)) {
    return res.status(400).json({ success: false, message: 'Valid adminId query parameter is required' });
  }

  try {
    const [requests] = await db.query(
      `SELECT
         jr.id,
         jr.club_id,
         c.name AS club_name,
         jr.user_id,
         jr.name AS user_name,
         jr.branch,
         jr.roll_number,
         jr.year,
         jr.role,
         jr.interest_goals,
         jr.status,
         jr.requested_at,
         jr.reviewed_at,
         u.email AS user_email,
         u.phone AS user_phone
       FROM join_requests jr
       JOIN clubs c ON c.id = jr.club_id
       JOIN users u ON u.id = jr.user_id
       WHERE c.admin_id = ? AND jr.status = 'pending'
       ORDER BY jr.requested_at DESC`,
      [adminId]
    );

    return res.json({ success: true, data: requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/admin/approve/:id
// Approve request and move user into club_members.
router.post('/admin/approve/:id', async (req, res) => {
  const requestId = Number(req.params.id);

  if (!isPositiveInt(requestId)) {
    return res.status(400).json({ success: false, message: 'Invalid request id' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, club_id, user_id, role, status
       FROM join_requests
       WHERE id = ?
       FOR UPDATE`,
      [requestId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Registration request not found' });
    }

    const request = rows[0];

    if (request.status !== 'pending') {
      await connection.rollback();
      return res.status(409).json({ success: false, message: `Request is already ${request.status}` });
    }

    const memberRole = normalizeMemberRole(request.role);

    await connection.query(
      `INSERT INTO club_members (club_id, user_id, role, status)
       VALUES (?, ?, ?, 'accepted')
       ON DUPLICATE KEY UPDATE role = VALUES(role), status = 'accepted'`,
      [request.club_id, request.user_id, memberRole]
    );

    await connection.query(
      'UPDATE join_requests SET status = "accepted", reviewed_at = NOW() WHERE id = ?',
      [requestId]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: 'Registration approved and user added to club members',
      status: 'accepted'
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// POST /api/admin/reject/:id
// Reject request without creating membership.
router.post('/admin/reject/:id', async (req, res) => {
  const requestId = Number(req.params.id);

  if (!isPositiveInt(requestId)) {
    return res.status(400).json({ success: false, message: 'Invalid request id' });
  }

  try {
    const [result] = await db.query(
      `UPDATE join_requests
       SET status = 'rejected', reviewed_at = NOW()
       WHERE id = ? AND status = 'pending'`,
      [requestId]
    );

    if (result.affectedRows === 0) {
      const [existing] = await db.query('SELECT status FROM join_requests WHERE id = ?', [requestId]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Registration request not found' });
      }
      return res.status(409).json({ success: false, message: `Request is already ${existing[0].status}` });
    }

    return res.json({ success: true, message: 'Registration rejected', status: 'rejected' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/users/:userId/requests
// User dashboard status list: pending, accepted, rejected.
router.get('/users/:userId/requests', async (req, res) => {
  const userId = Number(req.params.userId);

  if (!isPositiveInt(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user id' });
  }

  try {
    const [requests] = await db.query(
      `SELECT jr.id, jr.club_id, c.name AS club_name, jr.status, jr.requested_at, jr.reviewed_at
       FROM join_requests jr
       JOIN clubs c ON c.id = jr.club_id
       WHERE jr.user_id = ?
       ORDER BY jr.requested_at DESC`,
      [userId]
    );

    return res.json({ success: true, data: requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/users/:userId/clubs
// Alias for dashboard integration.
router.get('/users/:userId/clubs', async (req, res) => {
  const userId = Number(req.params.userId);

  if (!isPositiveInt(userId)) {
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

    return res.json({ success: true, data: clubs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
