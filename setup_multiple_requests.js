const db = require('./db');

(async () => {
  try {
    // Clear existing pending requests
    await db.query('DELETE FROM join_requests WHERE status = "pending"');
    
    // Create 3 test pending requests
    const requests = [
      { user_id: 2, club_id: 1, name: 'Alice Johnson', branch: 'CSE', roll: 'CSE002', year: '2nd', role: 'Member', goals: 'Want to learn web development and contribute to projects' },
      { user_id: 3, club_id: 1, name: 'Bob Smith', branch: 'ECE', roll: 'ECE003', year: '3rd', role: 'Coordinator', goals: 'Interested in IoT projects and leading technical workshops' },
      { user_id: 4, club_id: 1, name: 'Carol Davis', branch: 'ME', roll: 'ME004', year: '2nd', role: 'Member', goals: 'Passionate about robotics and automation' }
    ];

    for (const req of requests) {
      await db.query(
        'INSERT INTO join_requests (user_id, club_id, branch, roll_number, year, role, interest_goals, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user_id, req.club_id, req.branch, req.roll, req.year, req.role, req.goals, 'pending']
      );
    }
    
    console.log('✅ Created 3 test pending requests');
    
    // Verify
    const [results] = await db.query('SELECT id, user_id, role, status FROM join_requests WHERE status = "pending" ORDER BY id');
    console.log('\nPending requests:');
    results.forEach(r => {
      console.log(`  ID: ${r.id} | User: ${r.user_id} | Role: ${r.role} | Status: ${r.status}`);
    });
    
    console.log('\n✨ Ready! Open: http://localhost:3000/Frontend/admin_dashboard.html');
    process.exit(0);
  } catch (err) {
    console.log('Error:', err.message);
    process.exit(1);
  }
})();
