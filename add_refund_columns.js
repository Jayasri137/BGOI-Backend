require('dotenv').config();
const mysql = require('mysql2/promise');

async function addRefundColumns() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bgoi_portal',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log("Checking if columns exist...");
        const [columns] = await connection.execute("SHOW COLUMNS FROM leads LIKE 'refund_status'");
        if (columns.length === 0) {
            console.log("Adding refund columns to leads table...");
            await connection.execute(`
                ALTER TABLE leads 
                ADD COLUMN refund_status VARCHAR(50) DEFAULT 'Not Applicable',
                ADD COLUMN refund_amount DECIMAL(10, 2) DEFAULT 0.00,
                ADD COLUMN refund_date DATETIME NULL,
                ADD COLUMN refund_remarks TEXT NULL
            `);
            console.log("Successfully added refund columns.");
        } else {
            console.log("Refund columns already exist.");
        }
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await connection.end();
    }
}

addRefundColumns();
