const mysql = require('mysql2/promise');
async function run() {
  try {
    const pool = mysql.createPool({ host: 'auth-db1278.hstgr.io', user: 'u287260207_bgoi_user', password: '4g@LMW2026', database: 'u287260207_bgoi_bg' });
    const [tables] = await pool.execute("SHOW TABLES LIKE '%history%'");
    console.log(tables);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
