const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyIndexes() {
    console.log("🚀 Starting CRM Indexing Process...");

    // Create a connection pool using Hostinger credentials
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'auth-db1278.hstgr.io',
        user: process.env.DB_USER || 'u287260207_bgoi_user',
        password: process.env.DB_PASSWORD || '4g@LMW2026',
        database: process.env.DB_NAME || 'u287260207_bgoi_bg',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    const indexesToCreate = [
        // ----------------------------------------------------
        // 1. LEADS TABLE (The most heavy table in the CRM)
        // ----------------------------------------------------
        // Basic filtering
        { table: 'leads', name: 'idx_leads_domain', columns: 'domain' },
        { table: 'leads', name: 'idx_leads_status', columns: 'status' },
        { table: 'leads', name: 'idx_leads_assigned_to', columns: 'assigned_to' },
        { table: 'leads', name: 'idx_leads_is_active', columns: 'is_active' },
        { table: 'leads', name: 'idx_leads_source', columns: 'source' },
        { table: 'leads', name: 'idx_leads_source_type', columns: 'source_type' },
        { table: 'leads', name: 'idx_leads_company_name', columns: 'company_name' },
        { table: 'leads', name: 'idx_leads_category', columns: 'category' },
        { table: 'leads', name: 'idx_leads_payment_status', columns: 'payment_status' },
        
        // Date sorting and filtering (Crucial for Dashboards and Pagination)
        { table: 'leads', name: 'idx_leads_created_at', columns: 'created_at' },
        { table: 'leads', name: 'idx_leads_updated_at', columns: 'updated_at' },
        
        // Search functionality
        { table: 'leads', name: 'idx_leads_student_name', columns: 'student_name' },
        { table: 'leads', name: 'idx_leads_phone', columns: 'phone' },
        { table: 'leads', name: 'idx_leads_email', columns: 'email' },
        { table: 'leads', name: 'idx_leads_lead_code', columns: 'lead_code' },

        // ----------------------------------------------------
        // 2. DASHBOARD SPECIFIC (Composite Indexes)
        // ----------------------------------------------------
        // These target heavy GROUP BY and date-range queries on the dashboard
        { table: 'leads', name: 'idx_dash_domain_status_date', columns: 'domain, status, created_at' },
        { table: 'leads', name: 'idx_dash_assigned_status', columns: 'assigned_to, status' },
        { table: 'leads', name: 'idx_dash_created_domain', columns: 'created_at, domain' },
        { table: 'user_activity_logs', name: 'idx_activity_user_date', columns: 'user_id, activity_date' },
        { table: 'user_activity_logs', name: 'idx_activity_date', columns: 'activity_date' },

        // ----------------------------------------------------
        // 3. USERS TABLE
        // ----------------------------------------------------
        { table: 'users', name: 'idx_users_email', columns: 'email' },
        { table: 'users', name: 'idx_users_is_active', columns: 'is_active' },
        { table: 'users', name: 'idx_users_deleted_at', columns: 'deleted_at' },
        { table: 'users', name: 'idx_users_domain', columns: 'domain' },

        // ----------------------------------------------------
        // 3. HISTORY TABLE
        // ----------------------------------------------------
        { table: 'history', name: 'idx_history_lead_id', columns: 'lead_id' },
        { table: 'history', name: 'idx_history_created_at', columns: 'created_at' },

        // ----------------------------------------------------
        // 4. LEAD DOCUMENTS & REMARKS
        // ----------------------------------------------------
        { table: 'lead_documents', name: 'idx_leaddocs_lead_id', columns: 'lead_id' },
        { table: 'remark_messages', name: 'idx_remarks_lead_id', columns: 'lead_id' },

        // ----------------------------------------------------
        // 5. ASSETS TABLE
        // ----------------------------------------------------
        { table: 'assets', name: 'idx_assets_assigned_to', columns: 'assigned_to' },
        { table: 'assets', name: 'idx_assets_status', columns: 'status' }
    ];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const index of indexesToCreate) {
        try {
            // Attempt to create the index
            const query = `CREATE INDEX ${index.name} ON ${index.table} (${index.columns})`;
            await pool.query(query);
            console.log(`✅ Created index '${index.name}' on table '${index.table}'`);
            successCount++;
        } catch (err) {
            // Error Code 1061 means Duplicate Key Name (Index already exists)
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log(`⏭️  Skipped index '${index.name}' (Already exists)`);
                skipCount++;
            } else if (err.code === 'ER_NO_SUCH_TABLE') {
                console.log(`⚠️  Skipped index '${index.name}' (Table '${index.table}' does not exist)`);
                skipCount++;
            } else {
                console.error(`❌ Error creating index '${index.name}':`, err.message);
                errorCount++;
            }
        }
    }

    console.log("\n📊 Indexing Summary:");
    console.log(`   - Successfully created: ${successCount}`);
    console.log(`   - Skipped (already exist or missing table): ${skipCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log("\n✨ CRM Indexing Complete! Your system should now be much faster.");
    
    process.exit(0);
}

applyIndexes().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
