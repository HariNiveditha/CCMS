const db = require('./db');

(async () => {
  try {
    const [results] = await db.query('SHOW TABLES');
    console.log('Available tables:', JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (err) {
    console.log('Error:', err.message);
    process.exit(1);
  }
})();
