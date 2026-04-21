const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    timezone: '+05:30'
});

async function check() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Connected to database.");

        const [tables] = await connection.query("SHOW TABLES LIKE 'master_documentation%'");
        console.log("Tables found:", tables.map(t => Object.values(t)[0]));

        if (tables.length > 0) {
            const [docs] = await connection.query("SELECT COUNT(*) as count FROM master_documentation");
            console.log("master_documentation count:", docs[0].count);

            const [mappings] = await connection.query("SELECT COUNT(*) as count FROM master_documentation_mappings");
            console.log("master_documentation_mappings count:", mappings[0].count);
            
            if (docs[0].count === 0) {
                const [oldReqs] = await connection.query("SHOW TABLES LIKE 'master_document_requirements'");
                if (oldReqs.length > 0) {
                    const [oldCount] = await connection.query("SELECT COUNT(*) as count FROM master_document_requirements");
                    console.log("Old master_document_requirements count:", oldCount[0].count);
                } else {
                    console.log("Old table master_document_requirements NOT FOUND");
                }
            }
        }

    } catch (err) {
        console.error("Check failed:", err.message);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

check();
