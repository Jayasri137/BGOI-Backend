const mysql = require('mysql2/promise');

async function runMigration() {
    console.log("--- STARTING DATABASE MIGRATION: ADD can_edit COLUMN ---");
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

        // Check if can_edit column already exists
        const [columns] = await connection.execute("DESCRIBE users");
        const hasCanEdit = columns.some(col => col.Field === 'can_edit');

        if (hasCanEdit) {
            console.log("Column 'can_edit' already exists in 'users' table. Skipping migration.");
        } else {
            console.log("Adding 'can_edit' column to 'users' table...");
            await connection.execute("ALTER TABLE users ADD COLUMN can_edit TINYINT(1) DEFAULT 1 AFTER can_export_copy");
            console.log("Column 'can_edit' added successfully!");
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
