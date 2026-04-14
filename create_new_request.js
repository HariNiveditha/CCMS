const db = require('./db');

(async () => {
  try {
    // Insert a new test pending request
    const [insertResult] = await db.query(
      'INSERT INTO join_requests (user_id, club_id, branch, roll_number, year, role, interest_goals, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [2, 1, 'ECE', 'ECE002', '3rd', 'Coordinator', 'Want to coordinate club activities', 'pending']
    );
    
    console.log('New pending request created with ID:', insertResult.insertId);
    process.exit(0);
  } catch (err) {
    console.log('Error:', err.message);
    process.exit(1);
  }
})();
