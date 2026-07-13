const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 50,
});

async function migrate() {
    console.log("Starting Migration to add overseas_pipeline_status...");

    try {
        await pool.execute(`
            ALTER TABLE leads 
            ADD COLUMN overseas_pipeline_status VARCHAR(100) DEFAULT 'Document Collection'
        `);
        console.log("Successfully added overseas_pipeline_status column to leads table.");
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log("Column overseas_pipeline_status already exists. Skipping.");
        } else {
            console.error("Migration failed:", error);
        }
    } finally {
        await pool.end();
    }
}

migrate();
