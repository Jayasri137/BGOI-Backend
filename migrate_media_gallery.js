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
        console.log("Creating media_gallery table...");
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS media_gallery (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                domain_name      VARCHAR(255) NOT NULL,
                category         VARCHAR(50) NOT NULL, -- 'image', 'video', 'document'
                period_year      VARCHAR(50) DEFAULT NULL, -- e.g., '2023-2024'
                month            VARCHAR(50) DEFAULT NULL, -- e.g., 'January'
                file_path        VARCHAR(500) NOT NULL,
                title            VARCHAR(255) DEFAULT NULL,
                upload_date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ media_gallery table created successfully!");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}

run();
