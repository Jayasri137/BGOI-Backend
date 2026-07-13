const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function insertDummyData() {
    try {
        console.log("Starting dummy data insertion...");

        // 1. ASSETS
        console.log("Inserting Assets...");
        const assetsData = [
            ['Laptop', 'MacBook Pro M2', 'Apple', 'M2 2023', 'admin', 'pass123', 150000.00, null, null, 1],
            ['Laptop', 'ThinkPad T14', 'Lenovo', 'T14 Gen 3', 'staff', 'pass123', 85000.00, null, null, 1],
            ['Mobile', 'iPhone 14', 'Apple', '14', null, null, 65000.00, null, null, 1],
            ['Accessory', 'Wireless Mouse', 'Logitech', 'MX Master 3', null, null, 8000.00, null, 'Conference Room', 0],
            ['Laptop', 'Dell XPS 15', 'Dell', 'XPS 15 9520', 'agent1', 'pass123', 180000.00, null, 'Demo Agent', 1],
            ['Accessory', 'Webcam', 'Logitech', 'C920', null, null, 5000.00, null, null, 0],
            ['Tablet', 'iPad Air', 'Apple', '5th Gen', null, null, 55000.00, null, 'Demo Agent', 1],
            ['Mobile', 'Samsung S23', 'Samsung', 'S23 Ultra', null, null, 110000.00, null, null, 1]
        ];

        for (const a of assetsData) {
            const date = randomDate(new Date(2023, 0, 1), new Date());
            const created_at = formatDate(date);
            await pool.query(
                `INSERT INTO assets (category, asset_name, brand, model, login_username, login_password, approx_value, assigned_to, custom_assigned_name, has_charger, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [...a, created_at, created_at]
            );
        }

        // 2. BGOI ENQUIRIES (Mobile App)
        console.log("Inserting Mobile Enquiries...");
        const enquiriesData = [
            ['BGOI-MOB-1', 'Overseas', 'John Doe', 'john@example.com', '9876543210', 'Interested in UK Universities', '1000000', '{"source":"iOS"}'],
            ['BGOI-MOB-2', 'IAS Academy', 'Jane Smith', 'jane@example.com', '9876543211', 'Looking for UPSC coaching', '50000', '{"source":"Android"}'],
            ['BGOI-MOB-3', 'Preschool', 'Alice Brown', 'alice@example.com', '9876543212', 'Admission for 3yr old', '20000', '{"source":"iOS"}'],
            ['BGOI-MOB-4', 'Sports', 'Bob White', 'bob@example.com', '9876543213', 'Cricket coaching enquiry', '15000', '{"source":"Web"}'],
            ['BGOI-MOB-5', 'Tech Park', 'Charlie Black', 'charlie@example.com', '9876543214', 'Office space rental', '500000', '{"source":"Android"}']
        ];

        for (const e of enquiriesData) {
            const date = randomDate(new Date(2023, 6, 1), new Date());
            const created_at = formatDate(date);
            await pool.query(
                `INSERT INTO bgoi_enquiries (lead_code, service_type, candidate_name, email, phone, remarks, budget, details, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [...e, created_at]
            );
        }

        // 3. MEDIA GALLERY
        console.log("Inserting Media Gallery items...");
        const mediaData = [
            ['Overseas', 'Event', '2023', 'uploads/media/sample_event.jpg', 'UK University Fair 2023', 'October'],
            ['IAS Academy', 'Achievement', '2023', 'uploads/media/sample_achieve.jpg', 'UPSC Toppers Felicitation', 'August'],
            ['Preschool', 'Celebration', '2024', 'uploads/media/sample_celeb.jpg', 'Annual Day 2024', 'January'],
            ['Sports', 'Tournament', '2024', 'uploads/media/sample_sport.jpg', 'Inter-School Cricket Final', 'March'],
            ['Tech Park', 'Infrastructure', '2024', 'uploads/media/sample_infra.jpg', 'New IT Block Inauguration', 'May']
        ];

        for (const m of mediaData) {
            const date = randomDate(new Date(2023, 0, 1), new Date());
            const upload_date = formatDate(date);
            await pool.query(
                `INSERT INTO media_gallery (domain_name, category, period_year, file_path, title, month, upload_date) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [...m, upload_date]
            );
        }
        
        console.log("Successfully inserted dummy data into assets, bgoi_enquiries, and media_gallery!");

    } catch (err) {
        console.error("Error inserting dummy data:", err);
    } finally {
        process.exit(0);
    }
}

insertDummyData();
