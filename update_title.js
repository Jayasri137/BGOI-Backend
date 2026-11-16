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
        await pool.execute(
            "UPDATE our_people SET position = ? WHERE name = 'Dr. K. Lakshminarayan'",
            ['Head of Growth & Development- South Asia']
        );
        
        console.log("✅ Successfully updated the title for Dr. K. Lakshminarayan!");
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
