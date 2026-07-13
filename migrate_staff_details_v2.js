const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    connectTimeout: 30000,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 50,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});

async function run() {
    const connection = await pool.getConnection();
    try {
        console.log("Adding new columns to staff_personal_details table...");

        const alterStatements = [
            // New personal detail columns
            "ALTER TABLE staff_personal_details ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10) DEFAULT NULL",
            "ALTER TABLE staff_personal_details ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE staff_personal_details ADD COLUMN IF NOT EXISTS department VARCHAR(255) DEFAULT NULL",
            // New document path columns
            "ALTER TABLE staff_personal_details ADD COLUMN IF NOT EXISTS self_attestation_path VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE staff_personal_details ADD COLUMN IF NOT EXISTS bank_details_path VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE staff_personal_details ADD COLUMN IF NOT EXISTS offer_letter_path VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE staff_personal_details ADD COLUMN IF NOT EXISTS payslip_path VARCHAR(255) DEFAULT NULL",
        ];

        for (const sql of alterStatements) {
            try {
                await connection.execute(sql);
                console.log(`✅ OK: ${sql.substring(0, 80)}...`);
            } catch (err) {
                // Column may already exist in older MySQL versions without IF NOT EXISTS support
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`⚠️  Column already exists, skipping.`);
                } else {
                    console.error(`❌ Error: ${err.message}`);
                }
            }
        }

        console.log("\n✅ Migration complete! New columns added to staff_personal_details.");
    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        connection.release();
        process.exit(0);
    }
}

run();
