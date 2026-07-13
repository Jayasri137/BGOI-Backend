const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: 'auth-db1278.hstgr.io',
        user: 'u287260207_bgoi_user',
        password: '4g@LMW2026',
        database: 'u287260207_bgoi_bg',
    });

    try {
        console.log("Adding last_login_ip and last_login_location to users table...");
        await pool.query("ALTER TABLE users ADD COLUMN last_login_ip VARCHAR(255) DEFAULT NULL");
        await pool.query("ALTER TABLE users ADD COLUMN last_login_location VARCHAR(255) DEFAULT NULL");
        console.log("Success!");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist.");
        } else {
            console.error(e);
        }
    } finally {
        await pool.end();
    }
}

run();
