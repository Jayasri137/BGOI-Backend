const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
});

async function main() {
    try {
        console.log("Connecting to the database...");

        // Check if column already exists
        const [columns] = await pool.execute(`
            SHOW COLUMNS FROM learning_countries LIKE 'is_active'
        `);

        if (columns.length > 0) {
            console.log("Column 'is_active' already exists on 'learning_countries' table.");
        } else {
            console.log("Adding 'is_active' column to 'learning_countries' table...");
            await pool.execute(`
                ALTER TABLE learning_countries 
                ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER flag
            `);
            console.log("Column 'is_active' added successfully! All existing countries are set to active (1) by default.");
        }
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

main();
