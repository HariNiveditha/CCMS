const db = require('./db');

(async () => {
  try {
    // Add name column to join_requests
    try {
      await db.query('ALTER TABLE join_requests ADD COLUMN name VARCHAR(255)');
      console.log('✅ Added name column to join_requests');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('✓ Name column already exists');
      } else {
        throw err;
      }
    }
    
    // Update existing requests with names from the users table
    await db.query(`
      UPDATE join_requests jr
      JOIN users u ON u.id = jr.user_id
      SET jr.name = u.name
      WHERE jr.name IS NULL
    `);
    console.log('✅ Updated existing requests with user names');
    
    // Verify the schema
    const [cols] = await db.query('DESC join_requests');
    console.log('\nJoin_requests columns:', cols.map(c => c.Field).join(', '));
    
    process.exit(0);
  } catch (err) {
    console.log('Error:', err.message);
    process.exit(1);
  }
})();
