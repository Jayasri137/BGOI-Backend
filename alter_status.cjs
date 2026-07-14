const mysql = require('mysql2/promise');

async function run() {
    try {
        const pool = mysql.createPool({
            host: 'auth-db1278.hstgr.io',
            user: 'u287260207_bgoi_user',
            password: '4g@LMW2026',
            database: 'u287260207_bgoi_bg',
        });

        console.log("Altering status ENUM...");
        await pool.query(`ALTER TABLE leads MODIFY COLUMN status ENUM('New','Follow Up','Waiting for Confirmation','Enrolled','Closed','Invalid','Dropped','Contacted','Confirmed','Interested','Not Interested') DEFAULT 'New'`);
        console.log("Successfully altered status ENUM.");
        
        process.exit(0);
    } catch (e) {
        console.error("Failed to alter status ENUM:", e.message);
        process.exit(1);
    }
}
run();
