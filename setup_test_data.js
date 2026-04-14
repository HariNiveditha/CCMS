const db = require('./db');

(async () => {
  try {
    // First, check what tables exist
    const [tables] = await db.query('SHOW TABLES');
    console.log('Existing tables:', tables.map(t => Object.values(t)[0]));
    
    // Create join_requests table if it doesn't exist (for club registration)
    await db.query(`
      CREATE TABLE IF NOT EXISTS join_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        club_id INT NOT NULL,
        branch VARCHAR(100),
        roll_number VARCHAR(50),
        year VARCHAR(20),
        role ENUM('Coordinator', 'Member'),
        interest_goals TEXT,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL
      )
    `);
    
    // Create club_members table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS club_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        club_id INT NOT NULL,
        user_id INT NOT NULL,
        role VARCHAR(50),
        status VARCHAR(50),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_member (club_id, user_id)
      )
    `);
    
    console.log('Tables created successfully');
    
    // Check if we have any clubs
    const [clubs] = await db.query('SELECT id, name FROM clubs LIMIT 1');
    let clubId = 1;
    if (clubs.length > 0) {
      clubId = clubs[0].id;
      console.log('Using existing club ID:', clubId);
    } else {
      // Insert a test club if none exists
      const [insertClub] = await db.query('INSERT INTO clubs (name, description) VALUES (?, ?)', 
        ['Tech Club', 'A club for technology enthusiasts']);
      clubId = insertClub.insertId;
      console.log('Created test club with ID:', clubId);
    }
    
    // Clear existing pending requests to avoid duplicates
    await db.query('DELETE FROM join_requests WHERE status = ?', ['pending']);
    
    // Insert a test pending request
    const [insertResult] = await db.query(
      'INSERT INTO join_requests (user_id, club_id, branch, roll_number, year, role, interest_goals, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, clubId, 'CSE', 'CSE001', '2nd', 'Member', 'Interested in web development and cloud computing', 'pending']
    );
    
    const requestId = insertResult.insertId;
    console.log('\nTest request created with ID:', requestId);
    
    // Query pending requests
    const [results] = await db.query('SELECT id, user_id, club_id, status FROM join_requests WHERE status = ?', ['pending']);
    console.log('Pending requests:', JSON.stringify(results, null, 2));
    
    console.log('\n✅ Test data ready! You can now approve request ID:', requestId);
    console.log('Command: Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/admin/approve/' + requestId);
    
    process.exit(0);
  } catch (err) {
    console.log('Error:', err.message);
    process.exit(1);
  }
})();
