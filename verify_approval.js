const db = require('./db');

(async () => {
  try {
    const [results] = await db.query('SELECT id, user_id, club_id, status FROM join_requests WHERE id = 1');
    console.log('Updated request status:');
    console.log(JSON.stringify(results, null, 2));
    
    // Also check club_members table
    const [members] = await db.query('SELECT * FROM club_members WHERE user_id = 1');
    console.log('\nUser now in club_members:');
    console.log(JSON.stringify(members, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.log('Error:', err.message);
    process.exit(1);
  }
})();
