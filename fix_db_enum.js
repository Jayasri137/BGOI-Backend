const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg'
});

async function run() {
    try {
        await pool.execute("ALTER TABLE lead_documents MODIFY COLUMN status ENUM('Pending', 'Collected', 'Uploaded', 'Verified', 'Rejected') DEFAULT 'Pending'");
        console.log("✅ SQL Success: 'Collected' status added to lead_documents table.");
    } catch (err) {
        console.error("❌ SQL Error:", err.message);
    } finally {
        process.exit();
    }
}

run();
