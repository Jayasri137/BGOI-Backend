const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    timezone: '+05:30'
});

async function debug() {
    try {
        console.log('--- DATABASE DIAGNOSTIC ---');
        
        console.log('\n[Status Distribution]');
        const [statuses] = await pool.execute("SELECT status, COUNT(*) as count FROM leads GROUP BY status");
        statuses.forEach(row => console.log(` - "${row.status}": ${row.count}`));

        console.log('\n[Payment Status Distribution]');
        const [payments] = await pool.execute("SELECT payment_status, COUNT(*) as count FROM leads GROUP BY payment_status");
        payments.forEach(row => console.log(` - "${row.payment_status}": ${row.count}`));

        console.log('\n--- DIAGNOSTIC COMPLETE ---');
    } catch (err) {
        console.error('Diagnostic failed:', err.message);
    } finally {
        await pool.end();
    }
}
debug();
