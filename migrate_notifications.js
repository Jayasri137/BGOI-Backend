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
        console.log('--- MIGRATING notifications table ---');
        
        // Add target_domains and target_user_ids
        await pool.execute("ALTER TABLE notifications ADD COLUMN target_domains TEXT DEFAULT NULL");
        await pool.execute("ALTER TABLE notifications ADD COLUMN target_user_ids TEXT DEFAULT NULL");
        
        // Also add to notifications_history to track changes to these fields
        await pool.execute("ALTER TABLE notifications_history ADD COLUMN old_target_domains TEXT DEFAULT NULL");
        await pool.execute("ALTER TABLE notifications_history ADD COLUMN new_target_domains TEXT DEFAULT NULL");
        await pool.execute("ALTER TABLE notifications_history ADD COLUMN old_target_user_ids TEXT DEFAULT NULL");
        await pool.execute("ALTER TABLE notifications_history ADD COLUMN new_target_user_ids TEXT DEFAULT NULL");

        console.log('Migration successful');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}
migrate();
