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
        const [columns] = await pool.execute(`
            SHOW COLUMNS FROM users LIKE 'show_country_menu'
        `);
        
        if (columns.length > 0) {
            console.log("Column 'show_country_menu' already exists on 'users' table.");
        } else {
            console.log("Adding 'show_country_menu' column to 'users' table...");
            await pool.execute(`
                ALTER TABLE users ADD COLUMN show_country_menu TINYINT(1) DEFAULT 0 AFTER can_edit
            `);
            console.log("Column 'show_country_menu' added successfully!");
        }
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

main();
