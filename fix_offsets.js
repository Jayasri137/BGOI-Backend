const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    timezone: '+05:30'
});

async function fixTime() {
    try {
        console.log("Starting time correction for today's records...");
        
        // Fix leads created today that are in the future
        // We subtract 5.5 hours (19800 seconds)
        const [res1] = await pool.execute(`
            UPDATE leads 
            SET created_at = DATE_SUB(created_at, INTERVAL 330 MINUTE)
            WHERE DATE(created_at) = '2026-04-09' 
            AND created_at > NOW()
        `);
        console.log(`Fixed ${res1.affectedRows} leads.`);

        const [res2] = await pool.execute(`
            UPDATE lead_remarks_messages 
            SET created_at = DATE_SUB(created_at, INTERVAL 330 MINUTE)
            WHERE DATE(created_at) = '2026-04-09' 
            AND created_at > NOW()
        `);
        console.log(`Fixed ${res2.affectedRows} remark messages.`);

        const [res3] = await pool.execute(`
            UPDATE notifications 
            SET created_at = DATE_SUB(created_at, INTERVAL 330 MINUTE),
                updated_at = DATE_SUB(updated_at, INTERVAL 330 MINUTE)
            WHERE DATE(created_at) = '2026-04-09' 
            AND created_at > NOW()
        `);
        console.log(`Fixed ${res3.affectedRows} notifications.`);

        console.log("Correction complete.");
        process.exit(0);
    } catch (err) {
        console.error("Error during correction:", err);
        process.exit(1);
    }
}

fixTime();
