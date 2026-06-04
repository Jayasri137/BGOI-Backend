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
        console.log('--- MIGRATION: Adding user_type to users ---');
        
        // 1. Add user_type column if not exists
        await pool.execute(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS user_type ENUM('CORE', 'AGENT', 'FRANCHISE') DEFAULT 'CORE' AFTER role
        `);
        console.log('✅ Column user_type added (or already exists).');

        // 2. Ensure company_name exists (it was already in schema but let's be sure)
        await pool.execute(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) DEFAULT NULL AFTER user_type
        `);
        console.log('✅ Column company_name verified.');

        // 3. Add index to company_name
        try {
            await pool.execute('CREATE INDEX idx_users_company ON users(company_name)');
            console.log('✅ Index added to company_name.');
        } catch (idxErr) {
            console.log('ℹ️ Index might already exist or skipped:', idxErr.message);
        }

        // 4. Update existing users to CORE
        await pool.execute("UPDATE users SET user_type = 'CORE' WHERE user_type IS NULL");
        console.log('✅ Existing users updated to CORE.');

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();



