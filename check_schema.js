const mysql = require('mysql2/promise');

async function checkSchema() {
    const pool = mysql.createPool({
        host: 'auth-db1278.hstgr.io',
        user: 'u287260207_bgoi_user',
        password: '4g@LMW2026',
        database: 'u287260207_bgoi_bg',
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0
    });

    try {
        const [rows] = await pool.execute("DESCRIBE leads");
        console.log("LEADS SCHEMA:");
        console.log(JSON.stringify(rows, null, 2));
        
        const [rows2] = await pool.execute("DESCRIBE bgoi_enquiries");
        console.log("\nBGOI_ENQUIRIES SCHEMA:");
        console.log(JSON.stringify(rows2, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
