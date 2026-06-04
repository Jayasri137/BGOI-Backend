const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
});

async function main() {
    try {
        console.log("Connecting to the database to create learning_resources table...");
        
        // Create learning_resources table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS learning_resources (
                id INT AUTO_INCREMENT PRIMARY KEY,
                country_id VARCHAR(50) NOT NULL,
                category_id VARCHAR(50) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_size VARCHAR(50) NOT NULL,
                file_date VARCHAR(50) NOT NULL,
                file_path VARCHAR(500) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log("Table 'learning_resources' verified/created successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

main();
