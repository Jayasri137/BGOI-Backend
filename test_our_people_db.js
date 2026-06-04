const mysql = require('mysql2/promise');

async function verifyOurPeopleTable() {
    const pool = mysql.createPool({
        host: 'auth-db1278.hstgr.io',
        user: 'u287260207_bgoi_user',
        password: '4g@LMW2026',
        database: 'u287260207_bgoi_bg',
        waitForConnections: true,
        connectionLimit: 1,
    });

    try {
        console.log("Connecting to database...");
        
        // 1. Check if u287260207_bgoi_bg database has our_people table
        const [tables] = await pool.execute("SHOW TABLES LIKE 'our_people'");
        if (tables.length === 0) {
            console.log("Table 'our_people' does not exist. Creating table...");
            await pool.execute(`
                CREATE TABLE our_people (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    position VARCHAR(255) NOT NULL,
                    image_key VARCHAR(255) DEFAULT '',
                    image_data LONGTEXT DEFAULT NULL,
                    bio TEXT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            console.log("Table 'our_people' created successfully!");
        } else {
            console.log("Table 'our_people' already exists. Describing schema:");
            const [columns] = await pool.execute("DESCRIBE our_people");
            console.log(JSON.stringify(columns, null, 2));

            // Verify if image_data is LONGTEXT or TEXT to support large Base64 files
            const imageDataCol = columns.find(c => c.Field === 'image_data');
            if (imageDataCol && imageDataCol.Type.toLowerCase() !== 'longtext') {
                console.log("Updating 'image_data' column type to LONGTEXT to support high-quality base64 images...");
                await pool.execute("ALTER TABLE our_people MODIFY COLUMN image_data LONGTEXT DEFAULT NULL");
                console.log("Column 'image_data' altered to LONGTEXT.");
            }
        }
    } catch (err) {
        console.error("Database script error:", err.message);
    } finally {
        await pool.end();
    }
}

verifyOurPeopleTable();
