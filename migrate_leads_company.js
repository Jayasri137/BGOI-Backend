
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg'
});

async function migrate() {
    try {
        console.log('Starting migration to fix NULL company names in leads...');
        
        // 1. Get all leads where company_name is NULL
        const [leads] = await pool.execute(
            'SELECT id, assigned_to, assigned_by FROM leads WHERE company_name IS NULL AND (assigned_to IS NOT NULL OR assigned_by IS NOT NULL)'
        );
        
        console.log(`Found ${leads.length} leads to evaluate.`);
        
        let fixedCount = 0;
        
        for (const lead of leads) {
            // Prefer assigned_by (creator) then assigned_to
            const creatorId = lead.assigned_by || lead.assigned_to;
            
            // Fetch the company_name of this user
            const [users] = await pool.execute('SELECT company_name FROM users WHERE id = ?', [creatorId]);
            
            if (users.length > 0 && users[0].company_name) {
                const company = users[0].company_name;
                await pool.execute('UPDATE leads SET company_name = ? WHERE id = ?', [company, lead.id]);
                console.log(`[FIXED] Lead ID ${lead.id} linked to company: ${company}`);
                fixedCount++;
            }
        }
        
        console.log(`Migration finished. Fixed ${fixedCount} leads.`);
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrate();
