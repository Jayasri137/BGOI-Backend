const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    timezone: '+05:30'
});

async function test() {
    try {
        console.log('--- TEST UPDATE ---');
        
        // Pick one Enrolled lead
        const [rows] = await pool.execute("SELECT id FROM leads WHERE status = 'Enrolled' LIMIT 1");
        if (rows.length === 0) {
            console.log('No Enrolled leads found.');
            return;
        }
        const leadId = rows[0].id;
        console.log(`Lead ID found: ${leadId}`);

        // Try to update payment_status
        await pool.execute("UPDATE leads SET payment_status = 'Advance payment' WHERE id = ?", [leadId]);
        console.log('Update query executed.');

        // Read back
        const [rows2] = await pool.execute("SELECT id, status, payment_status FROM leads WHERE id = ?", [leadId]);
        console.log('Read back result:', rows2[0]);

        if (rows2[0].payment_status === 'Advance payment') {
            console.log('SUCCESS: Update persisted.');
        } else {
            console.log('FAILURE: Update did NOT persist. Still:', `"${rows2[0].payment_status}"`);
        }

    } catch (err) {
        console.error('Test failed:', err.message);
    } finally {
        await pool.end();
    }
}
test();
