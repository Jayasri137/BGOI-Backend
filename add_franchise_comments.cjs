const mysql = require('mysql2/promise');

async function run() {
    try {
        const pool = mysql.createPool({
            host: 'auth-db1278.hstgr.io',
            user: 'u287260207_bgoi_user',
            password: '4g@LMW2026',
            database: 'u287260207_bgoi_bg',
        });

        console.log("Checking if franchise_comments exists...");
        const [columns] = await pool.query(`SHOW COLUMNS FROM leads LIKE 'franchise_comments'`);
        if (columns.length === 0) {
            await pool.query(`ALTER TABLE leads ADD COLUMN franchise_comments TEXT DEFAULT NULL`);
            console.log("Successfully added franchise_comments to leads table.");
        } else {
            console.log("franchise_comments already exists.");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
