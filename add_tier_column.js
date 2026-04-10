const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    timezone: '+05:30'
});

async function migrate() {
    try {
        console.log('--- STARTING USER TIER MIGRATION ---');
        
        // 1. Check if column exists
        const [columns] = await pool.query('SHOW COLUMNS FROM users LIKE "tier"');
        if (columns.length === 0) {
            console.log(' - Adding "tier" column to users table...');
            await pool.execute('ALTER TABLE users ADD COLUMN tier VARCHAR(20) DEFAULT NULL AFTER role');
            console.log(' ✅ Column added.');
        } else {
            console.log(' ✅ "tier" column already exists.');
        }

        // 2. Populate initial tier values based on role for existing users if NULL
        console.log(' - Populating NULL tiers based on roles...');
        const [res] = await pool.execute(`
            UPDATE users 
            SET tier = CASE 
                WHEN role = 'Super Admin' THEN 'SUPER_ADMIN'
                WHEN role IN ('Admin', 'TL', 'Manager') THEN 'ADMIN'
                ELSE 'STAFF'
            END
            WHERE tier IS NULL
        `);
        console.log(` ✅ Updated ${res.affectedRows} users.`);

        console.log('--- MIGRATION COMPLETE ---');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

migrate();
