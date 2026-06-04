const mysql = require('mysql2/promise');

async function runMigration() {
    console.log("--- STARTING DATABASE MIGRATION: ADD intake COLUMN ---");
    const connectionConfig = {
        host: 'auth-db1278.hstgr.io',
        user: 'u287260207_bgoi_user',
        password: '4g@LMW2026',
        database: 'u287260207_bgoi_bg',
        connectTimeout: 30000
    };

    let connection;
    try {
        connection = await mysql.createConnection(connectionConfig);
        console.log("Connected to Hostinger database successfully.");

        // Check if intake column already exists
        const [columns] = await connection.execute("DESCRIBE leads");
        const hasIntake = columns.some(col => col.Field === 'intake');

        if (hasIntake) {
            console.log("Column 'intake' already exists in 'leads' table. Skipping migration.");
        } else {
            console.log("Adding 'intake' column to 'leads' table...");
            await connection.execute("ALTER TABLE leads ADD COLUMN intake VARCHAR(255) DEFAULT NULL AFTER company_name");
            console.log("Column 'intake' added successfully!");
        }
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        if (connection) {
            await connection.end();
            console.log("Database connection closed.");
        }
        console.log("--- MIGRATION COMPLETED ---");
    }
}

runMigration();
