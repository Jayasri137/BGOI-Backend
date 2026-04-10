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
        console.log('--- STARTING COMPREHENSIVE MIGRATION ---');
        
        // 1. Rename Status categories
        const [statusRes] = await pool.execute(
            "UPDATE leads SET status = 'Enrolled' WHERE status = 'Admission' OR status = 'admission'"
        );
        console.log('Status: Admission -> Enrolled:', statusRes.affectedRows, 'rows');

        // 2. Unpaid -> Pending payment
        const [unpaidRes] = await pool.execute(
            "UPDATE leads SET payment_status = 'Pending payment' WHERE payment_status = 'Unpaid' OR payment_status = '' OR payment_status IS NULL"
        );
        console.log('Unpaid -> Pending payment:', unpaidRes.affectedRows, 'rows');

        // 3. Paid -> Full payment
        const [paidRes] = await pool.execute(
            "UPDATE leads SET payment_status = 'Full payment' WHERE payment_status = 'Paid' OR payment_status = 'Full Payment' OR payment_status = 'Final Payment'"
        );
        console.log('Paid -> Full payment:', paidRes.affectedRows, 'rows');

        // 4. Partially Paid -> Partial Payment
        const [partialRes] = await pool.execute(
            "UPDATE leads SET payment_status = 'Partial Payment' WHERE payment_status = 'Partially Paid' OR payment_status = 'Partial'"
        );
        console.log('Partially Paid -> Partial Payment:', partialRes.affectedRows, 'rows');

        console.log('--- MIGRATION COMPLETE ---');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}
migrate();
