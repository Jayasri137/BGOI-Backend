const mysql = require('mysql2/promise');

async function test() {
    const pool = mysql.createPool({
        host: 'auth-db1278.hstgr.io',
        user: 'u287260207_bgoi_user',
        password: '4g@LMW2026',
        database: 'u287260207_bgoi_bg',
    });
    
    try {
        const [rows] = await pool.execute('SELECT username, password FROM admins');
        console.log("Admins Table Credentials:", rows);
    } catch (e) {
        console.log("Error querying admins:", e.message);
    }

    try {
        const [users] = await pool.execute('SELECT email, role, user_type FROM users LIMIT 10');
        console.log("Users Table (first 10):", users);
    } catch(e) {
         console.log("Error querying users:", e.message);
    }
    pool.end();
}
test();
