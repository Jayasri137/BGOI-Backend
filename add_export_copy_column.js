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
            SHOW COLUMNS FROM users LIKE 'can_export_copy'
        `);
        
        if (columns.length > 0) {
            console.log("Column 'can_export_copy' already exists on 'users' table.");
        } else {
            console.log("Adding 'can_export_copy' column to 'users' table...");
            await pool.execute(`
                ALTER TABLE users ADD COLUMN can_export_copy TINYINT(1) DEFAULT 0
            `);
            console.log("Column 'can_export_copy' added successfully!");
        }
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

main();
