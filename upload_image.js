const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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
        const imagePath = path.join(__dirname, '../Front-End/src/assets/lakshminarayan.png');
        
        if (!fs.existsSync(imagePath)) {
            console.error("Image file not found at:", imagePath);
            return;
        }

        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const imageDataUri = `data:image/png;base64,${base64Image}`;

        await pool.execute(
            "UPDATE our_people SET image_data = ? WHERE name = 'Dr. K. Lakshminarayan'",
            [imageDataUri]
        );
        
        console.log("✅ Successfully uploaded lakshminarayan.png to the database for Dr. K. Lakshminarayan!");
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
