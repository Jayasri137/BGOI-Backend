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
        await pool.query('UPDATE our_people SET id = 13 WHERE id = 6 AND name = "Mr.Divit MS"');
        console.log('Successfully updated Divit MS to be after Dr. K. Lakshminarayan');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
