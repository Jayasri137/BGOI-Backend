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
    try {
        console.log("Creating staff_personal_details table...");
        const sql = `
        CREATE TABLE IF NOT EXISTS staff_personal_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            aadhar_name VARCHAR(255),
            personal_email VARCHAR(255),
            phone VARCHAR(50),
            dob DATE,
            doj DATE,
            address TEXT,
            has_experience TINYINT(1) DEFAULT 0,
            resume_path VARCHAR(255),
            aadhar_path VARCHAR(255),
            pan_path VARCHAR(255),
            degree_path VARCHAR(255),
            experience_path VARCHAR(255),
            other_doc_path VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        `;
        await pool.execute(sql);
        console.log("staff_personal_details table created successfully!");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        process.exit();
    }
}

run();
