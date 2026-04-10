const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    timezone: '+05:30'
});

async function diagnostic() {
    try {
        console.log("Checking current DB timestamps for today's leads...");
        const [rows] = await pool.execute("SELECT id, created_at FROM leads WHERE DATE(created_at) = '2026-04-09' ORDER BY created_at DESC LIMIT 5");
        console.log("Sample Data:", JSON.stringify(rows, null, 2));
        
        const [nowRows] = await pool.execute("SELECT NOW() as dbNow");
        console.log("DB NOW():", nowRows[0].dbNow);
        
        console.log("System Time (Node):", new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

诊断();
