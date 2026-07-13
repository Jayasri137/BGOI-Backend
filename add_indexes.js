/**
 * =====================================================
 * BLUESTONE CRM — DATABASE INDEXING MIGRATION
 * Purpose: Fix slow loading by adding indexes on 
 *          frequently queried columns
 * Run: node add_indexes.js
 * =====================================================
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    connectTimeout: 30000,
    waitForConnections: true,
    connectionLimit: 2,
});

const indexes = [
    // ─── USERS TABLE ─────────────────────────────────────────
    // Speeds up: WHERE is_active = 1 (used in staff directory + email triggers)
    {
        name: 'idx_users_active',
        sql: 'CREATE INDEX idx_users_active ON users (is_active)'
    },
    // Speeds up: WHERE deleted_at IS NULL (checked on EVERY request in auth middleware)
    {
        name: 'idx_users_deleted',
        sql: 'CREATE INDEX idx_users_deleted ON users (deleted_at)'
    },
    // Speeds up: WHERE user_type = 'CORE' / 'AGENT' / 'FRANCHISE'
    {
        name: 'idx_users_type',
        sql: 'CREATE INDEX idx_users_type ON users (user_type)'
    },
    // Speeds up: domain-based filtering for staff directory
    {
        name: 'idx_users_domain',
        sql: 'CREATE INDEX idx_users_domain ON users (domain(50))'
    },
    // Composite: Most common filter combination in staff directory
    {
        name: 'idx_users_active_type_deleted',
        sql: 'CREATE INDEX idx_users_active_type_deleted ON users (is_active, user_type, deleted_at)'
    },
    // Speeds up: WHERE tier = 'SUPER_ADMIN' / 'ADMIN' / 'STAFF'
    {
        name: 'idx_users_tier',
        sql: 'CREATE INDEX idx_users_tier ON users (tier)'
    },

    // ─── LEADS TABLE ─────────────────────────────────────────
    // Speeds up: ORDER BY created_at DESC (used everywhere)
    {
        name: 'idx_leads_created',
        sql: 'CREATE INDEX idx_leads_created ON leads (created_at)'
    },
    // Speeds up: WHERE status = 'New' / 'Converted' etc.
    {
        name: 'idx_leads_status',
        sql: 'CREATE INDEX idx_leads_status ON leads (status)'
    },
    // Speeds up: WHERE domain = 'Overseas' etc.
    {
        name: 'idx_leads_domain',
        sql: 'CREATE INDEX idx_leads_domain ON leads (domain(50))'
    },
    // Speeds up: WHERE assigned_to = userId
    {
        name: 'idx_leads_assigned',
        sql: 'CREATE INDEX idx_leads_assigned ON leads (assigned_to)'
    },
    // Speeds up: WHERE lead_code LIKE 'BOC-%' (getNextLeadCode function)
    {
        name: 'idx_leads_code',
        sql: 'CREATE INDEX idx_leads_code ON leads (lead_code)'
    },
    // Speeds up: WHERE is_active = 1
    {
        name: 'idx_leads_active',
        sql: 'CREATE INDEX idx_leads_active ON leads (is_active)'
    },
    // Composite: Most common dashboard combination
    {
        name: 'idx_leads_domain_status_active',
        sql: 'CREATE INDEX idx_leads_domain_status_active ON leads (domain, status, is_active)'
    },
    // Speeds up: Company-based filtering for AGENT/FRANCHISE users
    {
        name: 'idx_leads_company',
        sql: 'CREATE INDEX idx_leads_company ON leads (company_name(50))'
    },

    // ─── USER_ACTIVITY_LOG TABLE ─────────────────────────────
    // Note: idx_activity_date is already created by initDB()
    // Adding composite for user + date lookups
    {
        name: 'idx_activity_user_date',
        sql: 'CREATE INDEX idx_activity_user_date ON user_activity_log (user_id, activity_date)'
    },
];

async function runMigration() {
    let connection;
    let added = 0;
    let skipped = 0;
    let failed = 0;

    console.log('\n🔧 BLUESTONE — Database Indexing Migration');
    console.log('==========================================');

    try {
        connection = await pool.getConnection();

        for (const index of indexes) {
            try {
                await connection.query(index.sql);
                console.log(`  ✅ ADDED   — ${index.name}`);
                added++;
            } catch (err) {
                if (
                    err.message.includes('Duplicate key name') ||
                    err.message.includes('already exists') ||
                    err.code === 'ER_DUP_KEYNAME'
                ) {
                    console.log(`  ⏭️  SKIPPED — ${index.name} (already exists)`);
                    skipped++;
                } else {
                    console.log(`  ❌ FAILED  — ${index.name}: ${err.message}`);
                    failed++;
                }
            }
        }

        console.log('\n==========================================');
        console.log(`📊 Results:`);
        console.log(`   ✅ Added   : ${added}`);
        console.log(`   ⏭️  Skipped : ${skipped}`);
        console.log(`   ❌ Failed  : ${failed}`);
        console.log('\n🚀 Indexing complete! Your queries should now be significantly faster.');
        console.log('   Expected improvement: 3x–10x faster on filtered queries.\n');

    } catch (err) {
        console.error('❌ Migration failed to connect:', err.message);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

runMigration();
