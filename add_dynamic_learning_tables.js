const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
});

async function main() {
    try {
        console.log("Connecting to the database to create dynamic learning tables...");
        
        // Create learning_countries table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS learning_countries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                flag VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("Table 'learning_countries' verified/created successfully!");

        // Create learning_categories table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS learning_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("Table 'learning_categories' verified/created successfully!");
        
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

main();
