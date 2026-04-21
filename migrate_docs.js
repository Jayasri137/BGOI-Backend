const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    timezone: '+05:30'
});

async function migrate() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Connected to database.");

        // 1. Create new tables
        console.log("Creating new tables...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS master_documentation (
                id INT AUTO_INCREMENT PRIMARY KEY,
                document_name VARCHAR(255) NOT NULL,
                is_mandatory TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS master_documentation_mappings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doc_id INT NOT NULL,
                domain_id INT DEFAULT NULL,
                category_id INT DEFAULT NULL,
                value_id INT DEFAULT NULL,
                FOREIGN KEY (doc_id) REFERENCES master_documentation(id) ON DELETE CASCADE,
                FOREIGN KEY (domain_id) REFERENCES master_domains(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES master_categories(id) ON DELETE SET NULL,
                FOREIGN KEY (value_id) REFERENCES master_values(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Migrate existing data from master_document_requirements
        console.log("Migrating existing data...");
        const [oldReqs] = await connection.query("SELECT * FROM master_document_requirements");
        
        for (const req of oldReqs) {
            // Check if document already exists in master_documentation
            const [existingDoc] = await connection.query(
                "SELECT id FROM master_documentation WHERE document_name = ? AND is_mandatory = ?",
                [req.document_name, req.is_mandatory]
            );

            let docId;
            if (existingDoc.length > 0) {
                docId = existingDoc[0].id;
            } else {
                const [result] = await connection.query(
                    "INSERT INTO master_documentation (document_name, is_mandatory, created_at) VALUES (?, ?, ?)",
                    [req.document_name, req.is_mandatory, req.created_at]
                );
                docId = result.insertId;
            }

            // Create mapping
            let domainId = null, categoryId = null, valueId = null;
            if (req.level === 'domain') domainId = req.parent_id;
            else if (req.level === 'category') {
                categoryId = req.parent_id;
                // Find domain_id for this category
                const [cat] = await connection.query("SELECT domain_id FROM master_categories WHERE id = ?", [categoryId]);
                if (cat.length > 0) domainId = cat[0].domain_id;
            }
            else if (req.level === 'value') {
                valueId = req.parent_id;
                // Find category and domain
                const [val] = await connection.query("SELECT category_id FROM master_values WHERE id = ?", [valueId]);
                if (val.length > 0) {
                    categoryId = val[0].category_id;
                    const [cat] = await connection.query("SELECT domain_id FROM master_categories WHERE id = ?", [categoryId]);
                    if (cat.length > 0) domainId = cat[0].domain_id;
                }
            }

            await connection.query(
                "INSERT INTO master_documentation_mappings (doc_id, domain_id, category_id, value_id) VALUES (?, ?, ?, ?)",
                [docId, domainId, categoryId, valueId]
            );
        }

        console.log("Migration completed successfully.");

    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

migrate();
