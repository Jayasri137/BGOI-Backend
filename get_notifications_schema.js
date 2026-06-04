const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    timezone: '+05:30'
});

async function schema() {
    try {
        console.log('--- TABLE SCHEMA: notifications ---');
        const [rows] = await pool.execute("SHOW CREATE TABLE notifications");
        console.log(rows[0]['Create Table']);
    } catch (err) {
        console.error('Schema diagnostic failed:', err.message);
    } finally {
        await pool.end();
    }
}
schema();
