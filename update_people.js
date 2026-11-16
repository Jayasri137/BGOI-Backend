const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: 'srv696.hstgr.io',
        user: 'u287260207_bgoi_user',
        password: '4g@LMW2026',
        database: 'u287260207_bgoi_bg',
        waitForConnections: true,
        connectionLimit: 1,
    });

    try {
        // Soft delete Mr. Saravanan (id = 4)
        await pool.execute("UPDATE our_people SET is_active = 0 WHERE id = 4");
        console.log("✅ Mr. Saravanan has been removed from the live section.");

        // Insert Dr. K. Lakshminarayan
        // Leaving bio blank or basic so you can edit it later via the admin panel
        const bio = "";
        await pool.execute("INSERT INTO our_people (name, position, image_key, image_data, bio, is_active) VALUES (?, ?, ?, ?, ?, ?)", [
            'Dr. K. Lakshminarayan',
            'Growth & Development Manager',
            'lakshminarayan',
            '',
            bio,
            1
        ]);
        console.log("✅ Dr. K. Lakshminarayan added successfully.");
        
        console.log("\n--- Updated Active Leadership Team ---");
        const [rows] = await pool.execute("SELECT id, name, position, is_active FROM our_people WHERE is_active = 1 ORDER BY id ASC");
        console.table(rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
