require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupAssetsDB() {
    console.log("Connecting to Database...");
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'auth-db1278.hstgr.io',
            user: 'u287260207_bgoi_user',
            password: '4g@LMW2026',
            database: 'u287260207_bgoi_bg',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log("Creating `assets` table if it doesn't exist...");

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS assets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category VARCHAR(100) NOT NULL,
                asset_name VARCHAR(150),
                brand VARCHAR(100),
                model VARCHAR(100),
                login_username VARCHAR(100),
                login_password VARCHAR(100),
                approx_value DECIMAL(12,2),
                assigned_to INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.execute(createTableQuery);
        console.log("✅ `assets` table created successfully.");

    } catch (err) {
        console.error("❌ Database setup error:", err);
    } finally {
        if (connection) {
            await connection.end();
            console.log("Database connection closed.");
        }
    }
}

setupAssetsDB();
