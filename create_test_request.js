const db = require('./db');

(async () => {
  try {
    // Insert a test pending request
    const [insertResult] = await db.query(
      'INSERT INTO club_requests (user_id, club_name, branch, roll_number, year, role, interest_goals, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 'Tech Club', 'CSE', 'CSE001', '2nd', 'Member', 'Interested in web development and cloud computing', 'pending']
    );
    
    console.log('Test request created with ID:', insertResult.insertId);
    
    // Query pending requests
    const [results] = await db.query('SELECT id, user_id, club_name, status FROM club_requests WHERE status = ?', ['pending']);
    console.log('\nPending requests:');
    console.log(JSON.stringify(results, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.log('Error:', err.message);
    process.exit(1);
  }
})();
