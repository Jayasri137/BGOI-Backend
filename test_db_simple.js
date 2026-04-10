const mysql = require('mysql2/promise');

const config = {
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    connectTimeout: 20000,
    timezone: '+05:30'
};

async function testConnection() {
    console.log('--- DB Connection Test ---');
    console.log('Target:', config.host);
    
    try {
        console.log('Attempting to connect...');
        const conn = await mysql.createConnection(config);
        console.log('✅ Connected successfully!');
        
        const [rows] = await conn.execute('SELECT 1 + 1 AS result');
        console.log('Query result:', rows[0].result);
        
        await conn.end();
        console.log('Connection closed.');
    } catch (err) {
        console.error('❌ Connection failed!');
        console.error('Code:', err.code);
        console.error('Errno:', err.errno);
        console.error('Message:', err.message);
    }
}

testConnection();
