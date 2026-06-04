const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
});

async function run() {
    try {
        console.log("=== Checking Column Collations ===");
        
        const [leadsColumns] = await pool.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_SET_NAME, COLLATION_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'u287260207_bgoi_bg' AND TABLE_NAME = 'leads'
              AND DATA_TYPE IN ('varchar', 'char', 'text', 'mediumtext', 'longtext')
        `);
        console.log("\n--- 'leads' table string columns collations ---");
        console.log(JSON.stringify(leadsColumns, null, 2));

        const [enqColumns] = await pool.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_SET_NAME, COLLATION_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'u287260207_bgoi_bg' AND TABLE_NAME = 'bgoi_enquiries'
              AND DATA_TYPE IN ('varchar', 'char', 'text', 'mediumtext', 'longtext')
        `);
        console.log("\n--- 'bgoi_enquiries' table string columns collations ---");
        console.log(JSON.stringify(enqColumns, null, 2));

        const [usersColumns] = await pool.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_SET_NAME, COLLATION_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'u287260207_bgoi_bg' AND TABLE_NAME = 'users'
              AND DATA_TYPE IN ('varchar', 'char', 'text', 'mediumtext', 'longtext')
        `);
        console.log("\n--- 'users' table string columns collations ---");
        console.log(JSON.stringify(usersColumns, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
