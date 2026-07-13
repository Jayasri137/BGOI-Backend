const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    connectTimeout: 30000,
    waitForConnections: true,
    connectionLimit: 5,
});

async function run() {
    const conn = await pool.getConnection();
    try {
        console.log("Creating staff_records_history table...");
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS staff_records_history (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                staff_record_id  INT NOT NULL,
                action_type      VARCHAR(50) NOT NULL, -- 'CREATED', 'UPDATED', 'DELETED'
                action_details   TEXT DEFAULT NULL,    -- JSON or string description of changes
                performed_by     VARCHAR(255) NOT NULL, -- User who made the change
                performed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (staff_record_id) REFERENCES staff_records(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ staff_records_history table created successfully!");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}

run();
