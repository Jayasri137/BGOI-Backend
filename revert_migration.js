const mysql = require('mysql2/promise');
async function run() {
  try {
    const pool = mysql.createPool({ host: 'auth-db1278.hstgr.io', user: 'u287260207_bgoi_user', password: '4g@LMW2026', database: 'u287260207_bgoi_bg' });
    const [result] = await pool.execute("UPDATE leads SET domain = 'Bluestone Overseas' WHERE domain = 'Placements' AND (category != 'Job' OR category IS NULL)");
    console.log('Reverted rows:', result.affectedRows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
