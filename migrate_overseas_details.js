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
    console.log("Starting Migration...");

    try {
        // 1. Create the new table
        console.log("Creating lead_overseas_details table...");
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS lead_overseas_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lead_id INT NOT NULL,
                field_key VARCHAR(255) NOT NULL,
                field_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_lead_field (lead_id, field_key),
                FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Table lead_overseas_details created or already exists.");

        // 2. Fetch leads with extra_financials
        console.log("Fetching leads with extra_financials...");
        const [rows] = await pool.execute("SELECT id, extra_financials FROM leads WHERE extra_financials IS NOT NULL AND extra_financials != ''");
        
        let migratedCount = 0;

        // 3. Migrate data
        for (const row of rows) {
            let extraFin = {};
            try {
                extraFin = typeof row.extra_financials === 'string' ? JSON.parse(row.extra_financials) : row.extra_financials;
            } catch (e) {
                continue; // Skip invalid JSON
            }

            if (extraFin && extraFin.overseas_details && Object.keys(extraFin.overseas_details).length > 0) {
                const details = extraFin.overseas_details;
                
                // Insert each key-value pair
                for (const [key, value] of Object.entries(details)) {
                    if (value !== undefined && value !== null && value !== '') {
                        await pool.execute(
                            `INSERT INTO lead_overseas_details (lead_id, field_key, field_value) 
                             VALUES (?, ?, ?)
                             ON DUPLICATE KEY UPDATE field_value = VALUES(field_value)`,
                            [row.id, key, String(value)]
                        );
                    }
                }

                // Remove overseas_details from extra_financials to avoid duplication
                delete extraFin.overseas_details;

                // Update the lead record
                await pool.execute(
                    "UPDATE leads SET extra_financials = ? WHERE id = ?",
                    [JSON.stringify(extraFin), row.id]
                );

                migratedCount++;
            }
        }

        console.log(`Migration completed successfully! Migrated overseas_details for ${migratedCount} leads.`);

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

migrate();
