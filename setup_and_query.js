const db = require('./db');

(async () => {
  try {
    // Create club_requests table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS club_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        club_name VARCHAR(255) NOT NULL,
        branch VARCHAR(100),
        roll_number VARCHAR(50),
        year VARCHAR(20),
        role ENUM('Coordinator', 'Member'),
        interest_goals TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('club_requests table created successfully');
    
    // Now query pending requests
    const [results] = await db.query('SELECT id, user_id, club_name, status FROM club_requests WHERE status = ? LIMIT 5', ['pending']);
    console.log('Pending requests:', JSON.stringify(results, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.log('Error:', err.message);
    process.exit(1);
  }
})();
