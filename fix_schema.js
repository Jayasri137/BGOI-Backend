const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    timezone: '+05:30'
});

async function fixSchema() {
    try {
        console.log('--- UPDATING DATABASE SCHEMA ---');
        
        // 1. Change payment_status to VARCHAR to allow any of the new names
        console.log(' - Modifying leads table schema...');
        await pool.execute("ALTER TABLE leads MODIFY COLUMN payment_status VARCHAR(50) DEFAULT 'Pending payment'");
        console.log(' ✅ payment_status changed to VARCHAR(50)');

        // 2. Perform Migration
        console.log('--- STARTING DATA MIGRATION ---');
        
        // Migrate legacy statuses for those Enrolled leads
        console.log(' - Assigning payment status to Enrolled leads...');
        const [res1] = await pool.execute(
            "UPDATE leads SET payment_status = 'Full payment' WHERE status = 'Enrolled' AND (payment_status = '' OR payment_status IS NULL OR payment_status = 'Unpaid' OR payment_status = 'Pending payment' OR payment_status = 'Final Payment')"
        );
        console.log(` ✅ Updated ${res1.affectedRows} Enrolled leads to 'Full payment'`);
        
        // Finalize all other Unpaid/Empty to Pending payment
        console.log(' - Standardizing all other leads to Pending payment...');
        const [res2] = await pool.execute(
            "UPDATE leads SET payment_status = 'Pending payment' WHERE payment_status = '' OR payment_status IS NULL OR payment_status = 'Unpaid'"
        );
        console.log(` ✅ Updated ${res2.affectedRows} leads to 'Pending payment'`);

        console.log('--- SCHEMA & DATA UPDATE COMPLETE ---');
    } catch (err) {
        console.error('Update failed:', err.message);
    } finally {
        await pool.end();
    }
}
fixSchema();
