// Run this once to create the standalone staff_records table
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    connectTimeout: 30000,
    waitForConnections: true,
    connectionLimit: 5,
});

async function run() {
    const conn = await pool.getConnection();
    try {
        console.log("Creating staff_records table...");
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS staff_records (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                employee_id      VARCHAR(50)  DEFAULT NULL,
                name             VARCHAR(255) NOT NULL,
                personal_email   VARCHAR(255) DEFAULT NULL,
                phone            VARCHAR(20)  DEFAULT NULL,
                dob              DATE         DEFAULT NULL,
                doj              DATE         DEFAULT NULL,
                blood_group      VARCHAR(10)  DEFAULT NULL,
                department       VARCHAR(100) DEFAULT NULL,
                designation      VARCHAR(100) DEFAULT NULL,
                emergency_contact VARCHAR(255) DEFAULT NULL,
                address          TEXT         DEFAULT NULL,
                has_experience   TINYINT(1)   DEFAULT 0,
                -- Document paths
                aadhar_path           VARCHAR(255) DEFAULT NULL,
                pan_path              VARCHAR(255) DEFAULT NULL,
                self_attestation_path VARCHAR(255) DEFAULT NULL,
                degree_path           VARCHAR(255) DEFAULT NULL,
                bank_details_path     VARCHAR(255) DEFAULT NULL,
                resume_path           VARCHAR(255) DEFAULT NULL,
                offer_letter_path     VARCHAR(255) DEFAULT NULL,
                experience_cert_path  VARCHAR(255) DEFAULT NULL,
                payslip_path          VARCHAR(255) DEFAULT NULL,
                other_doc_path        TEXT         DEFAULT NULL,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ staff_records table created successfully!");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}

run();
