const mysql = require('mysql2/promise');

async function debug() {
    const pool = mysql.createPool({
        host: 'auth-db1278.hstgr.io',
        user: 'u287260207_bgoi_user',
        password: '4g@LMW2026',
        database: 'u287260207_bgoi_bg',
    });

    try {
        console.log("Checking Leads Domains:");
        const [leads] = await pool.execute('SELECT domain, COUNT(*) as count FROM leads GROUP BY domain');
        console.table(leads);

        console.log("\nChecking Master Domains:");
        const [masters] = await pool.execute('SELECT name FROM master_domains');
        console.table(masters);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

debug();
