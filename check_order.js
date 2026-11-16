const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: 'srv696.hstgr.io',
        user: 'u287260207_bgoi_user',
        password: '4g@LMW2026',
        database: 'u287260207_bgoi_bg',
        waitForConnections: true,
        connectionLimit: 1,
    });

    try {
        const [rows] = await pool.query('SELECT id, name FROM our_people WHERE is_active = 1 ORDER BY id ASC');
        console.table(rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
