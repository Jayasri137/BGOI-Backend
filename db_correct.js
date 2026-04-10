const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    timezone: '+05:30',
    connectTimeout: 15000
});

async function runCorrection() {
    try {
        console.log("--- STARTING DB TIME CORRECTION ---");
        
        // 1. Leads Table (created_at only)
        // Adjust records from 2026-04-09 that are in the future relative to current correct IST
        // Actually, safer to just subtract 330 mins from all records made today.
        console.log("Fixing 'leads' table...");
        const [lRes] = await pool.execute(`
            UPDATE leads 
            SET created_at = DATE_SUB(created_at, INTERVAL 330 MINUTE)
            WHERE DATE(created_at) = '2026-04-09'
        `);
        console.log(`Leads updated: ${lRes.affectedRows}`);

        // 2. Lead Remarks Table (created_at)
        console.log("Fixing 'lead_remarks_messages' table...");
        const [rRes] = await pool.execute(`
            UPDATE lead_remarks_messages 
            SET created_at = DATE_SUB(created_at, INTERVAL 330 MINUTE)
            WHERE DATE(created_at) = '2026-04-09'
        `);
        console.log(`Remarks updated: ${rRes.affectedRows}`);

        // 3. Notifications Table (created_at, updated_at)
        console.log("Fixing 'notifications' table...");
        const [nRes] = await pool.execute(`
            UPDATE notifications 
            SET created_at = DATE_SUB(created_at, INTERVAL 330 MINUTE),
                updated_at = DATE_SUB(updated_at, INTERVAL 330 MINUTE)
            WHERE DATE(created_at) = '2026-04-09'
        `);
        console.log(`Notifications updated: ${nRes.affectedRows}`);

        // Verification: Get the 5 most recent leads
        console.log("\n--- VERIFICATION ---");
        const [sample] = await pool.execute("SELECT id, student_name, created_at FROM leads ORDER BY created_at DESC LIMIT 5");
        console.table(sample);

        console.log("\nCorrection routine finished successfully.");
        process.exit(0);
    } catch (err) {
        console.error("FATAL ERROR during correction:", err.message);
        process.exit(1);
    }
}

runCorrection();
