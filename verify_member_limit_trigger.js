const db = require('./db');

(async () => {
  try {
    const [userResult] = await db.query(
      `INSERT INTO users (roll_number, name, email, password, role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [
        'CBEXTRA01',
        'Extra Member',
        'extra.member@cbit.edu.in',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcg36',
        'student'
      ]
    );

    await db.query(
      `INSERT INTO club_members (club_id, user_id, role, status)
       VALUES (?, ?, 'member', 'accepted')`,
      [4, userResult.insertId]
    );

    console.log('Unexpected: insert succeeded. Trigger is not enforcing limit.');
  } catch (err) {
    console.log('Expected trigger block:', err.message);
  }

  process.exit(0);
})();
