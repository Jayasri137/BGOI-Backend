console.log("--- STARTING BLUESTONE BACKEND ---");
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const app = express();

// Multer Config for Documents
const docDir = path.join(__dirname, "uploads/documents");
if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
}
const storageDocuments = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/documents");
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + file.originalname;
        cb(null, unique);
    }
});
const uploadDocuments = multer({ 
    storage: storageDocuments,
    limits: { fileSize: 1024 * 1024 }, // 1 MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and images are allowed.'));
        }
    }
});
// Increase limits to handle Base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const JWT_SECRET = 'bg_secret_2026';
// SMTP config (direct code config, no .env)
const SMTP_CONFIG = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465
    user: 'bluestonesoftwaredeveloper@gmail.com',
    pass: 'hwmo dxbr oiub mpfr',
    from: 'Bluestone CRM <bluestonetechparkcbe@gmail.com>'
};
// --- 1. DATABASE CONNECTION ---
const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
   // host: '194.59.164.60', // Resolved from auth-db1278.hstgr.io to bypass DNS issues
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

// Centralized Query Helper to ensure connection reuse
async function query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}


// Proactive Error Monitor
pool.on('error', (err) => {
    console.error('[DATABASE POOL ERROR]:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.warn('Reconnecting lost database connection...');
    }
});

// --- IST HELPERS (Strictly +05:30) ---
function getISTDate() {
    const d = new Date();
    // Normalize to UTC then add 330 mins
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (330 * 60000));
}

function getISTString() {
    const d = getISTDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getISTDay() {
    const d = getISTDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "bluestoneocs@gmail.com",
        pass: "pffc oagp umot lssz",
    },
    tls: { rejectUnauthorized: false },
});

function getLeadCodePrefix(domain = '') {
    const key = String(domain || '').trim().toLowerCase();
    // Prefix mapping based on user request & business logic
    if (key.includes('overseas')) return 'BOC';
    if (key.includes('ias academy') || key === 'ias') return 'BIAS';
    if (key.includes('techpark') || key.includes('tech park') || key === 'tech') return 'BT';
    if (key.includes('placement')) return 'BP';
    if (key.includes('sport')) return 'BES';
    if (key.includes('language')) return 'BLH';
    if (key.includes('preschool') || key.includes('pre school')) return 'BIPS';
    if (key.includes('startup') || key.includes('start-up')) return 'BSP';
    if (key.includes('group') || key.includes('institution')) return 'BGOI';
    return 'BGOI';
}


function normalizeContactDomain(focus = '') {
    const key = String(focus || '').toLowerCase();
    if (key.includes('overseas')) return 'Overseas';
    if (key.includes('ias')) return 'IAS Academy';
    if (key.includes('tech')) return 'Techpark';
    if (key.includes('placement')) return 'Placements';
    if (key.includes('sport')) return 'Elite Sports';
    if (key.includes('language')) return 'Language Hub';
    if (key.includes('preschool')) return 'Preschool';
    if (key.includes('startup') || key.includes('business')) return 'Startup';
    if (key.includes('group')) return 'Group of Institutions';
    return focus;
}
function parseFocusList(raw = '') {
    if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);
    return String(raw || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
}
function getDomainAliases(domainInput = '') {
    // Convert input into an array of clean strings whether sent as "DomainA, DomainB" or ["DomainA", "DomainB"]
    const domainArray = Array.isArray(domainInput) ? domainInput : String(domainInput || '').split(',');
    const aliases = new Set();
    domainArray.forEach(d => {
        const key = String(d || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (!key) return;
        // 🔥 OVERSEAS
        if (key.includes('overseas')) {
            aliases.add('Overseas');
            aliases.add('Overseas Consulting');
            aliases.add('Bluestone Overseas');
        }
        // 🔥 IAS
        if (key.includes('ias')) {
            aliases.add('IAS Academy');
            aliases.add('IAS');
            aliases.add('Bluestone IAS Academy');
        }
        // 🔥 TECH
        if (key.includes('tech')) {
            aliases.add('Techpark');
            aliases.add('Tech Park');
            aliases.add('Bluestone Techpark');
        }
        // 🔥 PLACEMENT
        if (key.includes('placement')) {
            aliases.add('Placements');
            aliases.add('Placement Services');
            aliases.add('Placement Service');
            aliases.add('Bluestone Placements');
        }
        // 🔥 SPORTS
        if (key.includes('sport')) {
            aliases.add('Elite Sports');
            aliases.add('Sports');
            aliases.add('Bluestone Elite Sports');
        }
        // 🔥 LANGUAGE
        if (key.includes('language') || key.includes('languages')) {
            aliases.add('Language Hub');
            aliases.add('Bluestone Language Hub');
        }
        // 🔥 PRESCHOOL
        if (key.includes('preschool')) {
            aliases.add('Preschool');
            aliases.add('International Pre School');
            aliases.add('International Preschool');
            aliases.add('Bluestone Preschool');
        }
        // 🔥 STARTUP
        if (key.includes('startup') || key.includes('start up') || key.includes('start-up') || key.includes('business')) {
            aliases.add('Startup');
            aliases.add('Start-up');
            aliases.add('Business Ideas');
        }
        // 🔥 GROUP
        if (key.includes('group') || key.includes('institution')) {
            aliases.add('Group of Institutions');
            aliases.add('Bluestone Group');
        }
        // fallback if this specific item didn't match any triggers
        let matched = false;
        if (key.includes('overseas')) matched = true;
        if (key.includes('ias')) matched = true;
        if (key.includes('tech')) matched = true;
        if (key.includes('placement')) matched = true;
        if (key.includes('sport')) matched = true;
        if (key.includes('language')) matched = true;
        if (key.includes('preschool')) matched = true;
        if (key.includes('startup') || key.includes('business')) matched = true;
        if (key.includes('group') || key.includes('institution')) matched = true;

        if (!matched) {
            aliases.add(d);
        }
    });
    return Array.from(aliases);
}
function appendDomainCondition(sql, params, domainValue, tableAlias = '') {
    const aliases = getDomainAliases(domainValue);
    if (aliases.length === 0) return sql;
    const col = tableAlias ? `${tableAlias}.domain` : 'domain';

    // Use LIKE matching for ALL aliases to support comma-separated domain strings in the DB
    const likeClauses = aliases.map(() => `${col} LIKE ?`).join(' OR ');
    aliases.forEach(alias => params.push(`%${alias}%`));

    return `${sql} AND (${likeClauses})`;
}
async function getNextLeadCode(domain, db = pool) {
    const prefix = getLeadCodePrefix(domain);
    const [rows] = await db.execute(
        `SELECT lead_code
         FROM leads
         WHERE lead_code LIKE ?
         ORDER BY CAST(SUBSTRING_INDEX(lead_code, '-', -1) AS UNSIGNED) DESC
         LIMIT 1`,
        [`${prefix}-%`]
    );
    const last = rows[0]?.lead_code || '';
    const lastNum = parseInt(String(last).split('-')[1], 10);
    const nextNum = Number.isNaN(lastNum) ? 1 : lastNum + 1;
    return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}
function createMailTransporter() {
    const host = SMTP_CONFIG.host;
    const port = Number(SMTP_CONFIG.port || 587);
    const user = SMTP_CONFIG.user;
    const pass = SMTP_CONFIG.pass;
    if (!host || !user || !pass) return null;
    return nodemailer.createTransport({
        host,
        port,
        secure: SMTP_CONFIG.secure ?? (port === 465),
        auth: { user, pass }
    });
}
const sendContactEmail = async (toEmail, subject, htmlContent) => {
    const mailTransporter = createMailTransporter();
    if (!mailTransporter) return;
    try {
        await mailTransporter.sendMail({
            from: SMTP_CONFIG.from || SMTP_CONFIG.user,
            to: toEmail,
            subject: subject,
            html: htmlContent
        });
    } catch (err) {
        console.error(`Failed to send email to ${toEmail}:`, err.message);
    }
};
const triggerEmails = async (candidateName, candidateEmail, candidatePhone, candidateMessage, leadDomain, leadInterest, source = 'Website') => {
    // 1. Send to Candidate
    const candidateSubject = `Thank you for your enquiry - Bluestone Group of Institutions`;
    const candidateHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Hello ${candidateName},</h2>
            <p>Thank you for reaching out to us regarding <strong>${leadInterest || leadDomain}</strong>.</p>
            <p>We have received your enquiry and our team will get back to you shortly.</p>
            <br/>
            <p>Best Regards,</p>
            <p><strong>Bluestone Group of Institutions</strong></p>
        </div>
    `;
    sendContactEmail(candidateEmail, candidateSubject, candidateHtml);
    // Fetch Admins & Super Admins
    try {
        const [users] = await pool.execute('SELECT email, role, domain, is_active FROM users WHERE is_active = 1');
        const adminEmails = [];
        const superAdminEmails = [];
        for (const u of users) {
            const tier = getUserTier(u);
            if (tier === 'SUPER_ADMIN' && u.email) {
                superAdminEmails.push(u.email);
            } else if (tier === 'ADMIN' && u.email) {
                const aliases = getDomainAliases(u.domain);
                if (aliases.includes(leadDomain)) {
                    adminEmails.push(u.email);
                }
            }
        }
        const adminSubject = `New Enquiry Received (${source}): ${leadDomain} - ${candidateName}`;
        const adminHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>New Lead Enquiry</h2>
                <p>A new enquiry has been submitted from <strong>${source}</strong> for <strong>${leadDomain}</strong>.</p>
                <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 20px;">
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${candidateName}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${candidateEmail}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${candidatePhone}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Interested In:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${leadInterest || '-'}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Message:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${candidateMessage || '-'}</td></tr>
                </table>
                <br/>
                <p>Please log in to the portal to view full details.</p>
            </div>
        `;
        if (adminEmails.length > 0) sendContactEmail(adminEmails.join(','), adminSubject, adminHtml);
        if (superAdminEmails.length > 0) sendContactEmail(superAdminEmails.join(','), adminSubject, adminHtml);
    } catch (e) {
        console.error("Error fetching admins for email notification:", e);
    }
};

function formatWho(user = {}) {
    const id = user?.id ? `(${user.id}) ` : '';
    return `${id}${user?.name || 'System'}`.trim();
}
function deriveTierFromRole(role = '') {
    const r = String(role || '').trim();
    if (['Main Admin', 'MD', 'GM', 'Super Admin'].includes(r)) return 'SUPER_ADMIN';
    if (['TL', 'Coordinator', 'Head', 'Admin'].includes(r)) return 'ADMIN';
    if (r === 'Staff') return 'STAFF';
    return 'STAFF';
}
function getUserTier(user = {}) {
    return user?.tier || deriveTierFromRole(user?.role);
}
function isSuperAdminUser(user = {}) {
    return getUserTier(user) === 'SUPER_ADMIN';
}
function isAdminUser(user = {}) {
    const t = getUserTier(user);
    return t === 'ADMIN' || t === 'SUPER_ADMIN';
}
function isStaffUser(user = {}) {
    return getUserTier(user) === 'STAFF';
}
function canUserAccessLead(lead, user) {
    if (!lead || !user) return false;
    if (isSuperAdminUser(user)) return true;
    if (getUserTier(user) === 'ADMIN') {
        const aliases = getDomainAliases(user.domain);
        return aliases.includes(lead.domain);
    }
    if (isStaffUser(user)) return Number(lead.assigned_to) === Number(user.id);
    return false;
}

let lastGlobalCleanupTime = 0;
const userActivityCache = new Map();

// --- 2. AUTH TRACKING HELPER ---
async function trackUserActivity(userId) {
    if (!userId) return;
    try {
        const nowMs = Date.now();
        const lastUpdate = userActivityCache.get(userId) || 0;

        // 🔥 Interaction-Based Throttle: Only update DB once every 60 seconds
        if (nowMs - lastUpdate < 60000) {
            return;
        }

        userActivityCache.set(userId, nowMs);
        const today = getISTDay();
        const currentHour = getISTDate().getHours();

        // 1. Log hourly activity and 2. update real-time status in parallel
        await Promise.all([
            pool.execute(`
                INSERT INTO user_activity_log (user_id, activity_date, activity_hour, active_minutes, last_request_at)
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                active_minutes = CASE 
                    WHEN TIMESTAMPDIFF(MINUTE, last_request_at, CURRENT_TIMESTAMP) > 0 
                    AND TIMESTAMPDIFF(MINUTE, last_request_at, CURRENT_TIMESTAMP) < 10 
                    THEN active_minutes + 1 
                    ELSE active_minutes 
                END,
                last_request_at = CURRENT_TIMESTAMP
            `, [userId, today, currentHour]),
            pool.execute('UPDATE users SET last_active_at = CURRENT_TIMESTAMP, iactive = 1 WHERE id = ?', [userId])
        ]);

    } catch (err) {
        if (!String(err.message).includes('max_connections_per_hour')) {
            console.error(`[Activity Tracking] Error:`, err.message);
        }
    }
}

// --- AUTH MIDDLEWARE (FIXED) ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Fallback to req.body.token for navigator.sendBeacon compatibility
    const token = (authHeader && authHeader.split(' ')[1]) || req.body?.token;

    if (!token) {
        return res.status(401).json({ msg: "Access Denied: No Token Provided" });
    }
    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ msg: "Invalid or Expired Token" });
        }
        req.user = decodedUser;
        next();
    });
};
// --- 3. INITIALIZE TABLES ---
const initDB = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        // Set Session Timezone to IST (+05:30)
        await connection.query("SET time_zone = '+05:30'");

        // Hostinger optimization: Table verification is retired to save on hourly connection limits.
        // The core schema is already established and stable.

        // ❌ ENSURE SYSTEM EMAILS TABLE EXISTS
        await connection.query(`
            CREATE TABLE IF NOT EXISTS system_emails (
                id INT AUTO_INCREMENT PRIMARY KEY,
                label VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                is_active TINYINT DEFAULT 1,
                created_at DATETIME
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 🚀 PERFORMANCE OPTIMIZATION: Ensure activity_date is indexed to prevent ECONNRESET
        try {
            await connection.query("CREATE INDEX idx_activity_date ON user_activity_log (activity_date)");
        } catch (e) {
            // Index existing is fine
        }

        // 🔄 TERMINOLOGY MIGRATION: 
        // 1. Final payment -> Full payment
        await connection.query("UPDATE leads SET payment_status = 'Full payment' WHERE payment_status = 'Final Payment'");
        // 2. Closed -> Invalid (Fixing empty sub-menu table)
        await connection.query("UPDATE leads SET status = 'Invalid' WHERE status = 'Closed'");

        console.log("✅ Database Connectivity & Core Schema Verified");
    } catch (err) {
        console.error("❌ Database Connection Error:", err.message);
    } finally {
        if (connection) connection.release();
    }
};

// Global error handler for body parser limits to return a friendly JSON response
app.use((err, req, res, next) => {
    if (err && err.type === 'entity.too.large') {
        res.status(413).json({ error: 'Payload Too Large' });
    } else {
        next(err);
    }
});
// --- 4. ROUTES ---
// Public Contact Enquiry (website form -> portal leads)
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, message, businessFocus, domain, category, interested_in } = req.body;

        if (!name || !phone || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const nowStr = getISTString();
        // New mode: payload from master-driven contact form
        if (domain && category && interested_in) {
            const normalizedDomain = normalizeContactDomain(domain);
            const leadCode = await getNextLeadCode(normalizedDomain);
            await pool.execute(
                `INSERT INTO leads
                 (student_name, email, phone, domain, source, category, interested_in, remarks, lead_code, status, is_active, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', 1, ?)`,
                [
                    name,
                    email,
                    phone,
                    normalizedDomain,
                    'Website Contact',
                    category,
                    interested_in,
                    message || '',
                    leadCode,
                    nowStr
                ]
            );
            triggerEmails(name, email, phone, message, normalizedDomain, interested_in, 'Website Contact');
            return res.json({ success: true, message: "Enquiry saved successfully" });
        }
        // Backward compatible mode: old businessFocus payload
        if (!businessFocus?.length) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const normalizedDomains = Array.from(
            new Set(
                (Array.isArray(businessFocus) ? businessFocus : [businessFocus]).map((raw) =>
                    normalizeContactDomain(raw)
                )
            )
        );
        for (const domainName of normalizedDomains) {
            const leadCode = await getNextLeadCode(domainName);
            await pool.execute(
                `INSERT INTO leads
                 (student_name, email, phone, domain, source, category, interested_in, remarks, lead_code, status, is_active, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', 1, ?)`,
                [
                    name,
                    email,
                    phone,
                    domainName,
                    'Website Contact',
                    'Website Enquiry',
                    domainName,
                    message || '',
                    leadCode,
                    nowStr
                ]
            );
            triggerEmails(name, email, phone, message, domainName, domainName, 'Website Contact');
        }
        res.json({ success: true, message: "Enquiry saved successfully" });
    } catch (err) {
        console.error("CONTACT API ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});


// Mobile App Enquiry (Flutter app -> portal leads + BGOI Sync)
app.post('/api/enquiry', async (req, res) => {
    try {
        const { user_id, enquiry_for, candidate_name, service_type, details } = req.body;
        const userId = Number(user_id || req.body.app_user_id || req.body.userId) || null;

        const name = candidate_name || details?.full_name || 'Mobile User';
        const email = details?.email || '';
        const phone = details?.phone || '';
        const message = details?.message || details?.remarks || '';
        const service = service_type || enquiry_for || 'General';
        const normalizedDomain = normalizeContactDomain(service);
        const leadCode = await getNextLeadCode(normalizedDomain);

        const nowStr = getISTString();
        // 1. Insert into BGOI Specific table (Required for your app records)
        await pool.execute(
            `INSERT INTO bgoi_enquiries 
             (user_id, lead_code, enquiry_for, candidate_name, full_name, service_type, phone, email, remarks, budget, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, leadCode, enquiry_for || '', candidate_name || '', name, service, phone, email, message, details?.budget || '', nowStr]
        );

        // 2. Insert into Main leads table (Required for CRM Dashboard)
        await pool.execute(
            `INSERT INTO leads
             (student_name, email, phone, domain, source, category, interested_in, remarks, lead_code, status, is_active, app_user_id, created_at)
             VALUES (?, ?, ?, ?, 'Mobile App', 'Mobile Enquiry', ?, ?, ?, 'New', 1, ?, ?)`,
            [name, email, phone, normalizedDomain, service, message, leadCode, userId, nowStr]
        );

        // 3. Trigger BGOI App Notification
        if (userId) {
            await pool.execute(
                "INSERT INTO bgoi_notifications (user_id, title, message, type, created_at) VALUES (?, ?, ?, 'Enquiry', ?)",
                [userId, "Enquiry Submitted!", `Ref: ${leadCode}`, nowStr]
            );
        }

        triggerEmails(name, email, phone, message, normalizedDomain, service, 'Mobile App');
        res.status(201).json({ success: true, message: "Enquiry submitted successfully", lead_code: leadCode });
    } catch (err) {
        console.error("MOBILE ENQUIRY API ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});


// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
        if (rows.length === 0) return res.status(400).json({ msg: "Invalid credentials" });

        const user = rows[0];
        const [tierRows] = await pool.execute(
            'SELECT tier FROM master_user_hierarchy WHERE role_name = ? AND is_active = 1 LIMIT 1',
            [user.role]
        );
        const tier = tierRows[0]?.tier || deriveTierFromRole(user.role);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
        const token = jwt.sign(
            {
                id: user.id,
                employee_id: user.employee_id || null,
                name: user.name,
                role: user.role,
                domain: user.domain,
                tier: user.tier || tier
            },
            JWT_SECRET,
            { expiresIn: '12h' }
        );
        res.json({
            token,
            user: {
                id: user.id,
                employee_id: user.employee_id || null,
                name: user.name,
                role: user.role,
                domain: user.domain,
                designation: user.designation || null,
                tier: user.tier || tier
            }
        });

        // 🚀 Mark user as ONLINE immediately
        trackUserActivity(user.id);

    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, domain, designation, tier FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ msg: "User not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// --- Activity Ping ---
// Throttled endpoint that frontend calls to keep last_active_at updated without making data requests
app.post('/api/auth/ping', authenticateToken, (req, res) => {
    // Explicitly track activity here (moved from authenticateToken middleware)
    if (typeof trackUserActivity === "function") {
        trackUserActivity(req.user.id);
    }
    res.json({ success: true, msg: "Activity recorded" });
});

// Alias for auth/ping used by the new global heartbeat tracking
app.post('/api/user/heartbeat', authenticateToken, (req, res) => {
    if (typeof trackUserActivity === "function") {
        trackUserActivity(req.user.id);
    }
    res.json({ success: true });
});

// Offline Beacon (used on tab close/logout)
app.post('/api/user/offline', authenticateToken, async (req, res) => {
    try {
        await pool.execute('UPDATE users SET iactive = 0 WHERE id = ?', [req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Offline update failed" });
    }
});
// --- NEW: GRANULAR DASHBOARD STATS ---
app.get('/api/dashboard/stats/:timeframe/:type', authenticateToken, async (req, res) => {
    const { timeframe, type } = req.params;
    let { domain, userId: filterUserId } = req.query;
    const { role, domain: userDomain, id: loggedUserId } = req.user;

    // Security: Only Super Admins can query "All" or other domains
    const isSuperAdmin = isSuperAdminUser(req.user);
    if (!isSuperAdmin) domain = userDomain;

    try {
        const isSuperAdmin = isSuperAdminUser(req.user);
        if (!isSuperAdmin) domain = userDomain;

        let staffFilter = '';
        let staffParams = [];
        if (filterUserId && filterUserId !== 'All') {
            staffFilter = " AND assigned_to = ?";
            staffParams.push(filterUserId);
        } else if (isStaffUser(req.user)) {
            staffFilter = " AND assigned_to = ?";
            staffParams.push(loggedUserId);
        }

        // --- 1. LEADS TABLE PART ---
        let leadsSql = `SELECT status, domain, created_at FROM leads WHERE is_active = 1 ${staffFilter}`;
        let leadsParams = [...staffParams];

        // --- 2. MOBILE ENQUIRIES PART (Only if status matches 'New' or counting all enquiries) ---
        let mobileSql = "";
        let mobileParams = [];

        // Mobile entries only exist for 'enquiry' (all) or 'New' (special case)
        // If we are looking for 'admission' etc, mobile app doesn't have them yet (they move to leads)
        if (type === 'enquiry') {
            mobileSql = `
                SELECT 'New' AS status, service_type AS domain, created_at 
                FROM bgoi_enquiries e 
                WHERE 1=1 
                AND NOT EXISTS (
                    SELECT 1 FROM leads l 
                    WHERE l.source = 'Mobile App' AND l.student_name = e.candidate_name AND l.created_at = e.created_at
                )
            `;
            // NOTE: Mobile app enquiries have NO assigned_to yet. 
            // So if specifically filtering for a Staff user, they are naturally 0.
            if (staffFilter) mobileSql = ""; // Exclude unassigned mobile enquiries if a staff is selected
        }

        // Combine into a final counting query
        let finalSql = "";
        let finalParams = [];

        if (mobileSql) {
            finalSql = `SELECT COUNT(*) as count FROM ((${leadsSql}) UNION ALL (${mobileSql})) as combined WHERE 1=1`;
            finalParams = [...leadsParams, ...mobileParams];
        } else {
            finalSql = `SELECT COUNT(*) as count FROM (${leadsSql}) as combined WHERE 1=1`;
            finalParams = [...leadsParams];
        }

        // Apply Status Filter
        if (type === 'followup') finalSql += " AND status = 'Follow Up'";
        else if (type === 'enrolled') finalSql += " AND status = 'Enrolled'";
        else if (type === 'pending') finalSql += " AND status = 'Waiting for Confirmation'";
        else if (type === 'invalid') finalSql += " AND status = 'Invalid'";

        // Apply Domain Filter (Using appendDomainCondition on the combined result)
        if (domain && domain !== 'All') {
            finalSql = appendDomainCondition(finalSql, finalParams, domain);
        } else if (!isSuperAdmin && userDomain) {
            finalSql = appendDomainCondition(finalSql, finalParams, userDomain);
        }

        // Apply Timeframe Filter
        if (timeframe === 'today' || timeframe === 'history') {
            const { date } = req.query;
            if (date) {
                finalSql += " AND DATE(created_at) = ?";
                finalParams.push(date);
            } else if (timeframe === 'today') {
                finalSql += " AND DATE(created_at) = CURDATE()";
            }
        } else if (timeframe === 'week') {
            finalSql += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        } else if (timeframe === 'month') {
            finalSql += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
        } else if (timeframe === 'year') {
            finalSql += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";
        } else if (timeframe === 'custom') {
            const { startDate, endDate } = req.query;
            if (startDate && endDate) {
                finalSql += " AND DATE(created_at) BETWEEN ? AND ?";
                finalParams.push(startDate, endDate);
            }
        }

        const [rows] = await pool.execute(finalSql, finalParams);
        res.json({ count: rows[0].count });
    } catch (err) {
        console.error("Stats API Error:", err);
        res.status(500).json({ count: 0, error: err.message });
    }
});

// --- NEW: BULK DASHBOARD STATS (Consolidates 10 requests into 1) ---
app.get('/api/dashboard/stats-bulk', authenticateToken, async (req, res) => {
    let { domain, userId, timeframe, date, startDate, endDate } = req.query;
    const { domain: userDomain } = req.user;
    const isSuperAdmin = isSuperAdminUser(req.user);
    if (!isSuperAdmin) {
        if (domain && domain !== 'All') {
            // Validate selected domain is in user's authorized list
            const authorized = String(userDomain || '').split(',').map(d => d.trim().toLowerCase());
            if (!authorized.includes(domain.toLowerCase().trim())) {
                domain = userDomain; // Fallback to full unauthorized list or primary domain
            }
        } else {
            domain = userDomain;
        }
    }

    const buildMetricSql = (metricType, periodMode) => {
        let sql = "SELECT COUNT(*) as count FROM leads WHERE is_active = 1";
        let params = [];

        // Department/Domain Filter
        if (domain && domain !== 'All') {
            sql = appendDomainCondition(sql, params, domain);
        }

        // Staff/User Filter
        if (isStaffUser(req.user)) {
            sql += ' AND assigned_to = ?';
            params.push(req.user.id);
        } else if (userId && userId !== 'All') {
            sql += ' AND assigned_to = ?';
            params.push(Number(userId));
        }

        // Metric Type
        if (metricType === 'followup') sql += " AND status = 'Follow Up'";
        else if (metricType === 'enrolled') sql += " AND (payment_status IN ('Advance payment', 'Partial Payment', 'Full payment', 'No Fee'))";
        else if (metricType === 'pending') sql += " AND status = 'Waiting for Confirmation'";
        else if (metricType === 'invalid') sql += " AND status = 'Invalid'";

        // Timeframe
        if (periodMode) {
            if (timeframe === 'today' || (timeframe === 'history' && date)) {
                sql += " AND DATE(created_at) = ?";
                params.push(date || new Date().toISOString().split('T')[0]);
            } else if (timeframe === 'week') {
                sql += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
            } else if (timeframe === 'month') {
                sql += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            } else if (timeframe === 'year') {
                sql += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";
            } else if (timeframe === 'custom' && startDate && endDate) {
                sql += " AND DATE(created_at) BETWEEN ? AND ?";
                params.push(startDate, endDate);
            }
        }
        return { sql, params };
    };

    try {
        const metrics = [
            'enquiry', 'followup', 'enrolled', 'pending', 'invalid'
        ];

        // We run these in parallel on the server but they reuse the connection from the pool
        const results = await Promise.all([
            // Totals
            ...metrics.map(m => {
                const q = buildMetricSql(m, false);
                return query(q.sql, q.params);
            }),
            // Periods
            ...metrics.map(m => {
                const q = buildMetricSql(m, true);
                return query(q.sql, q.params);
            })
        ]);

        res.json({
            totals: {
                enquiry: results[0][0].count,
                followup: results[1][0].count,
                enrolled: results[2][0].count,
                pending: results[3][0].count,
                invalid: results[4][0].count,
            },
            periods: {
                enquiry: results[5][0].count,
                followup: results[6][0].count,
                enrolled: results[7][0].count,
                pending: results[8][0].count,
                invalid: results[9][0].count,
            }
        });
    } catch (err) {
        console.error("Bulk Stats Error:", err);
        res.status(500).json({ error: "Failed to fetch bulk stats" });
    }
});
// --- NEW: TODAY & PENDING LEADS LIST ---
app.get('/api/dashboard/leads-filter', authenticateToken, async (req, res) => {
    const { role, domain: userDomain, id: loggedUserId } = req.user;
    const {
        filterType,
        domain: selectedDomain,
        userId: filterUserId,
        timeframe = 'today',
        date,
        startDate,
        endDate
    } = req.query;

    const isSuperAdmin = isSuperAdminUser(req.user);

    try {
        // Standardized Base Query to match Stats Cards
        const combinedBase = `
            (
                SELECT id, student_name, email, phone, domain, source, category, interested_in, remarks, lead_code, payment_status, total_fees, paid_amount, invalid_reason, is_active, deleted_at, deleted_by, status, assigned_to, assigned_to_name, assigned_by, assigned_by_name, created_at
                FROM leads
                WHERE is_active = 1
                UNION ALL
                SELECT e.id, candidate_name AS student_name, e.email, e.phone, service_type AS domain, 'Mobile App (Live)' AS source, 'Mobile Enquiry' AS category, enquiry_for AS interested_in, e.remarks, lead_code, 'Pending payment' AS payment_status, 0 AS total_fees, 0 AS paid_amount, NULL AS invalid_reason, 1 AS is_active, NULL AS deleted_at, NULL AS deleted_by, 'New' AS status, NULL AS assigned_to, NULL AS assigned_to_name, NULL AS assigned_by, NULL AS assigned_by_name, created_at
                FROM bgoi_enquiries e
                WHERE NOT EXISTS (
                    SELECT 1 FROM leads l 
                    WHERE l.source = 'Mobile App (Live)' AND l.student_name = e.candidate_name AND l.created_at = e.created_at
                )
            ) AS combined
        `;

        let sql = `SELECT * FROM ${combinedBase} WHERE 1=1`;
        let params = [];

        // --- Apply Filters ---

        // 1. Staff/User Filter
        if (filterUserId && filterUserId !== 'All') {
            sql += " AND assigned_to = ?";
            params.push(filterUserId);
        } else if (isStaffUser(req.user)) {
            sql += " AND assigned_to = ?";
            params.push(loggedUserId);
        }

        // 2. Domain Filter (Security + Selection)
        if (!isSuperAdmin) {
            if (selectedDomain && selectedDomain !== 'All') {
                // Validate selected domain is in user's authorized list
                const authorized = String(userDomain || '').split(',').map(d => d.trim().toLowerCase());
                const effectiveDomain = authorized.includes(selectedDomain.toLowerCase().trim()) ? selectedDomain : userDomain;
                sql = appendDomainCondition(sql, params, effectiveDomain);
            } else {
                sql = appendDomainCondition(sql, params, userDomain);
            }
        } else if (selectedDomain && selectedDomain !== 'All') {
            sql = appendDomainCondition(sql, params, selectedDomain);
        }

        // --- 3. Timeframe filter logic ---
        if (timeframe === 'today' || timeframe === 'history') {
            if (date) {
                sql += " AND DATE(created_at) = ?";
                params.push(date);
            } else if (timeframe === 'today') {
                sql += " AND DATE(created_at) = CURDATE()";
            }
        } else if (timeframe === 'week') {
            sql += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        } else if (timeframe === 'month') {
            sql += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
        } else if (timeframe === 'year') {
            sql += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";
        } else if (timeframe === 'custom' && startDate && endDate) {
            sql += " AND DATE(created_at) BETWEEN ? AND ?";
            params.push(startDate, endDate);
        }

        if (filterType === 'today') {
            sql += " AND status = 'New'";
        } else if (filterType === 'pending') {
            sql += " AND status = 'Waiting for Confirmation'";
        } else if (filterType === 'updated') {
            sql += " AND status != 'New'";
        } else if (filterType === 'invalid') {
            sql += " AND status = 'Invalid'";
        }

        sql += " ORDER BY created_at DESC";
        if (filterType !== 'today') sql += " LIMIT 15";

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Dashboard Leads Filter Error:", err);
        res.status(500).json({ error: err.message });
    }
});
// Fetch Leads (Used by DomainPage.jsx)
// Fetch Leads (Used by DomainPage.jsx)
app.get('/api/leads', authenticateToken, async (req, res) => {
    const { domain, assignedTo, view, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;
    const { role, id: userId, domain: userDomain } = req.user;
    try {
        let where = "WHERE is_active = 1";
        const filters = [];
        const isSuperAdmin = isSuperAdminUser(req.user);
        const addDomainFilter = (domainValue) => {
            const aliases = getDomainAliases(domainValue);
            if (aliases.length <= 1) {
                where += " AND domain = ?";
                filters.push(aliases[0] || String(domainValue || '').trim());
                return;
            }
            where += ` AND domain IN (${aliases.map(() => '?').join(', ')})`;
            filters.push(...aliases);
        };
        if (isStaffUser(req.user)) {
            where += " AND assigned_to = ?";
            filters.push(userId);
        } else if (getUserTier(req.user) === 'ADMIN') {
            addDomainFilter(userDomain);
        } else if (domain && domain !== 'All') {
            addDomainFilter(domain);
        }
        if (assignedTo && (isSuperAdmin || getUserTier(req.user) === 'ADMIN')) {
            where += " AND assigned_to = ?";
            filters.push(Number(assignedTo));
        }

        // --- Apply View Filters ---
        if (view === 'invalid') {
            where += " AND status = 'Invalid'";
        } else if (view === 'waiting') {
            where += " AND status = 'Waiting for Confirmation'";
        } else if (view === 'dropped') {
            where += " AND status = 'Dropped'";
        } else if (view === 'payment') {
            // Enrolled metrics
            where += " AND (payment_status IN ('Advance payment', 'Partial Payment', 'Full payment', 'No Fee'))";
        } else if (view === 'follow-up') {
            where += " AND status = 'Follow Up'";
        }

        const baseSql = `
            (
                SELECT 
                    id, student_name, email, phone, domain, source, category, 
                    interested_in, remarks, lead_code, status, is_active, 
                    payment_status, total_fees, paid_amount,
                    assigned_to, assigned_to_name, assigned_by, assigned_by_name, created_at
                FROM leads
                WHERE is_active = 1
                
                UNION ALL
                
                SELECT 
                    e.id, 
                    COALESCE(NULLIF(e.candidate_name, ''), NULLIF(e.full_name, ''), u.name, 'Mobile User') AS student_name, 
                    e.email AS email, 
                    COALESCE(NULLIF(e.phone, ''), 'M-APP') AS phone, 
                    e.service_type AS domain, 
                    'Mobile App (Live)' AS source, 
                    'Mobile Enquiry' AS category,
                    e.enquiry_for AS interested_in, 
                    e.remarks AS remarks, 
                    CONCAT('M-', e.id) AS lead_code, 
                    'New' AS status, 
                    1 AS is_active,
                    'Pending payment' AS payment_status,
                    0 AS total_fees,
                    0 AS paid_amount,
                    NULL AS assigned_to, 
                    NULL AS assigned_to_name, 
                    NULL AS assigned_by, 
                    NULL AS assigned_by_name, 
                    e.created_at
                FROM bgoi_enquiries e
                LEFT JOIN users u ON e.user_id = u.id
                WHERE NOT EXISTS (
                    SELECT 1 FROM leads l 
                    WHERE l.source = 'Mobile App' 
                      AND (l.student_name = e.candidate_name OR l.student_name = e.full_name OR l.student_name = u.name)
                      AND l.created_at = e.created_at
                )
            ) AS combined
        `;
        const dataSql = `SELECT *, (SELECT subject FROM lead_remarks_messages WHERE lead_id = combined.id ORDER BY created_at DESC, id DESC LIMIT 1) as latest_remark_subject 
                        FROM ${baseSql} ${where} 
                        ORDER BY created_at DESC 
                        LIMIT ? OFFSET ?`;
        const countSql = `SELECT COUNT(*) as total FROM ${baseSql} ${where}`;
        const [rows] = await pool.execute(dataSql, [...filters, limitNum, offset]);
        const [countResult] = await pool.execute(countSql, filters);
        const total = countResult[0].total;
        res.json({
            leads: rows,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (err) {
        console.error("Lead list SQL ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});
// Create Lead (Enquiry Form)
// Register New Staff
app.post('/api/auth/register', authenticateToken, async (req, res) => {
    // Only Admins can register new staff
    if (!isAdminUser(req.user)) {
        return res.status(403).json({ msg: "Registration restricted to admins" });
    }

    const { employee_id, name, email, phone, role, tier, designation, domain, password } = req.body;

    // TIER SECURITY: Regular Admins can only create STAFF tier
    if (!isSuperAdminUser(req.user) && tier !== 'STAFF') {
        return res.status(403).json({ msg: "Only Super Admins can create Admin/Super Admin accounts" });
    }

    try {
        // 1. Check if user already exists
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ msg: "Staff with this email already exists" });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Save User
        const nowStr = getISTString();
        const [result] = await pool.execute(
            `INSERT INTO users (employee_id, name, email, phone, role, tier, designation, domain, password, is_active, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [employee_id, name, email, phone, role, tier, designation || null, domain, hashedPassword, nowStr]
        );

        res.status(201).json({ msg: "Staff registered successfully", userId: result.insertId });
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ error: "Registration failed", details: err.message });
    }
});

app.post('/api/leads', async (req, res) => {
    const { student_name, email, phone, domain, category, source, interested_in, remarks, assigned_to, assigned_to_name, assigned_by, assigned_by_name } = req.body;
    try {
        // ✅ NORMALIZE DOMAIN (CRITICAL FIX)
        const normalizedDomain = normalizeContactDomain(domain);

        // ❌ DUPLICATE CHECK (PHONE + DOMAIN)
        const [existing] = await pool.execute(
            'SELECT id, lead_code FROM leads WHERE phone = ? AND domain = ? LIMIT 1',
            [phone, normalizedDomain]
        );
        if (existing.length > 0) {
            return res.status(409).json({
                message: `Duplicate Entry: A lead with phone ${phone} already exists in ${normalizedDomain} (Code: ${existing[0].lead_code}).`
            });
        }
        const leadCode = await getNextLeadCode(normalizedDomain);
        const nowStr = getISTString();
        await pool.execute(
            `INSERT INTO leads 
            (student_name, email, phone, domain, category, source, interested_in, remarks, lead_code, status, is_active, payment_status, assigned_to, assigned_to_name, assigned_by, assigned_by_name, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', 1, 'Pending payment', ?, ?, ?, ?, ?)`,
            [
                student_name,
                email,
                phone,
                normalizedDomain,
                category,
                source || 'Dashboard',
                interested_in,
                remarks,
                leadCode,
                assigned_to || null,
                assigned_to_name || null,
                assigned_by || null,
                assigned_by_name || null,
                nowStr
            ]
        );
        // ✅ AUTO-RESPONDER EMAIL
        if (email && email.trim() !== '') {
            try {
                const transporter = createMailTransporter();
                if (transporter) {
                    const html = `
                        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
                            <h2 style="color: #0f172a;">Thank you for your Enquiry!</h2>
                            <p>Dear ${student_name},</p>
                            <p>We have received your enquiry regarding <strong>${normalizedDomain}</strong> services at Bluestone Groups.</p>
                            <p>Your reference number is <strong>${leadCode}</strong>. One of our representatives will review your request and get back to you shortly.</p>
                            <br/>
                            <p>Best regards,</p>
                            <p><strong>The Bluestone Groups Team</strong></p>
                        </div>
                    `;
                    transporter.sendMail({
                        from: SMTP_CONFIG.from || SMTP_CONFIG.user,
                        to: email.trim(),
                        subject: `Your Enquiry is Received - ${leadCode}`,
                        html
                    }).catch(err => console.error("Auto-responder mail send failed:", err.message));
                }
            } catch (mailErr) {
                console.error("Auto-responder mail configuration error:", mailErr.message);
            }
        }
        res.status(201).json({ msg: "Lead created", lead_code: leadCode });
    } catch (err) {
        console.error("CREATE LEAD ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});
// Update Status (Used by Dropdown in DomainPage)
app.put('/api/leads/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const changedBy = req.user?.name || 'System';
    try {
        const [beforeRows] = await pool.execute('SELECT status FROM leads WHERE id = ?', [id]);
        if (beforeRows.length === 0) return res.status(404).json({ msg: "Lead not found" });
        const oldStatus = beforeRows[0].status;
        const nowStr = getISTString();
        await pool.execute('UPDATE leads SET status = ? WHERE id = ?', [status, id]);
        await pool.execute(
            `INSERT INTO lead_edit_history (lead_id, action_type, field_name, old_value, new_value, changed_by, changed_at)
             VALUES (?, 'STATUS_UPDATE', 'status', ?, ?, ?, ?)`,
            [id, oldStatus || '', status || '', changedBy, nowStr]
        );
        res.json({ msg: "Updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Update Payment Details (Super Admin, Admin, and Staff)
app.put('/api/leads/:id/payment', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { payment_status, total_fees, paid_amount } = req.body;

    // Permissions: Allow Super Admin, Admin, Staff
    if (!isAdminUser(req.user) && !isStaffUser(req.user)) {
        return res.status(403).json({ msg: 'Only Super Admin, Admin and Staff can update payment details' });
    }

    try {
        const [beforeRows] = await pool.execute(
            'SELECT domain, payment_status, total_fees, paid_amount, assigned_to, status FROM leads WHERE id = ?',
            [id]
        );
        if (beforeRows.length === 0) return res.status(404).json({ msg: 'Lead not found' });
        const before = beforeRows[0];

        // Security: Ensure user has access to this lead
        if (!canUserAccessLead(before, req.user)) {
            return res.status(403).json({ msg: 'Access Denied: You do not have permission to update this lead' });
        }
        const allowedPaymentStatuses = [
            'Advance payment', 'Partial Payment', 'Full payment', 'No Fee', 'Pending payment',
            'Partial refund', 'Fully refund', 'No refund', 'Refund pending'
        ];
        const nextPaymentStatus = typeof payment_status === 'string' && payment_status.trim() !== ''
            ? payment_status.trim()
            : before.payment_status;

        if (!allowedPaymentStatuses.includes(nextPaymentStatus)) {
            return res.status(400).json({ msg: 'Invalid payment status value' });
        }
        const parseAmount = (value, fallback) => {
            if (value === undefined || value === null || value === '') return Number(fallback || 0);
            const num = Number(value);
            return Number.isFinite(num) ? num : NaN;
        };
        const nextTotalFees = parseAmount(total_fees, before.total_fees);
        const nextPaidAmount = parseAmount(paid_amount, before.paid_amount);
        if (Number.isNaN(nextTotalFees) || Number.isNaN(nextPaidAmount)) {
            return res.status(400).json({ msg: 'Fees and paid amount must be numbers' });
        }
        if (nextTotalFees < 0 || nextPaidAmount < 0) {
            return res.status(400).json({ msg: 'Fees and paid amount cannot be negative' });
        }

        // Auto-Enrollment: Set status to 'Enrolled' when payment is updated to anything other than 'Pending payment' or Refund statuses
        const refundStatuses = ['Partial refund', 'Fully refund', 'No refund', 'Refund pending'];
        const nextStatus = (nextPaymentStatus !== 'Pending payment' && !refundStatuses.includes(nextPaymentStatus))
            ? 'Enrolled'
            : before.status;

        await pool.execute(
            'UPDATE leads SET payment_status = ?, total_fees = ?, paid_amount = ?, status = ? WHERE id = ?',
            [nextPaymentStatus, nextTotalFees, nextPaidAmount, nextStatus, id]
        );
        const changedBy = req.user?.name || 'System';
        const historyRows = [];

        if (before.status !== nextStatus) {
            historyRows.push([id, 'STATUS_UPDATE', 'status', before.status || '', nextStatus, changedBy]);
        }
        if ((before.payment_status || '') !== (nextPaymentStatus || '')) {
            historyRows.push([id, 'PAYMENT_UPDATE', 'payment_status', before.payment_status || '', nextPaymentStatus || '', changedBy]);
        }
        if (Number(before.total_fees || 0) !== Number(nextTotalFees || 0)) {
            historyRows.push([id, 'PAYMENT_UPDATE', 'total_fees', String(before.total_fees || 0), String(nextTotalFees || 0), changedBy]);
        }
        if (Number(before.paid_amount || 0) !== Number(nextPaidAmount || 0)) {
            historyRows.push([id, 'PAYMENT_UPDATE', 'paid_amount', String(before.paid_amount || 0), String(nextPaidAmount || 0), changedBy]);
        }
        const nowStr = getISTString();
        for (const h of historyRows) {
            await pool.execute(
                `INSERT INTO lead_edit_history (lead_id, action_type, field_name, old_value, new_value, changed_by, changed_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [...h, nowStr]
            );
        }
        return res.json({
            msg: 'Payment details updated',
            payment: {
                payment_status: nextPaymentStatus,
                total_fees: nextTotalFees,
                paid_amount: nextPaidAmount,
                status: nextStatus
            }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// Super-admin consolidated leads with advanced filters/sort/pagination
app.get('/api/bgi/leads', authenticateToken, async (req, res) => {
    const isSuperAdmin = isSuperAdminUser(req.user);
    const isStaff = isStaffUser(req.user);

    const {
        view = 'all',
        page = 1,
        limit = 10,
        search = '',
        domain = 'All',
        status = 'All',
        payment_status = 'All',
        assigned_to = 'All',
        invalid_reason = 'All',
        source = 'All',
        sort_by = 'created_at',
        sort_order = 'desc',
        today,
        date,
        startDate,
        endDate
    } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (pageNum - 1) * limitNum;
    const sortMap = {
        created_at: 'created_at',
        student_name: 'student_name',
        domain: 'domain',
        status: 'status',
        payment_status: 'payment_status',
        total_fees: 'total_fees',
        paid_amount: 'paid_amount',
    };
    const safeSortBy = sortMap[sort_by] || 'created_at';
    const safeSortOrder = String(sort_order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    try {
        const combinedBase = `
            (
                SELECT 
                    id, student_name, email, phone, domain, source, category, 
                    interested_in, remarks, lead_code, status, is_active, payment_status, 
                    total_fees, paid_amount, invalid_reason,
                    assigned_to, assigned_to_name, assigned_by, assigned_by_name, created_at
                FROM leads
                WHERE is_active = 1
                
                UNION ALL
                
                SELECT 
                    e.id, 
                    COALESCE(NULLIF(e.candidate_name, ''), NULLIF(e.full_name, ''), 'Mobile User') AS student_name, 
                    e.email AS email, 
                    COALESCE(NULLIF(e.phone, ''), 'M-APP') AS phone, 
                    e.service_type AS domain, 
                    'Mobile App (Live)' AS source, 
                    'Mobile Enquiry' AS category,
                    e.enquiry_for AS interested_in, 
                    e.remarks AS remarks, 
                    CONCAT('M-', e.id) AS lead_code, 
                    'New' AS status, 
                    1 AS is_active,
                    'Pending payment' AS payment_status,
                    0 AS total_fees,
                    0 AS paid_amount,
                    NULL AS invalid_reason,
                    NULL AS assigned_to, 
                    NULL AS assigned_to_name, 
                    NULL AS assigned_by, 
                    NULL AS assigned_by_name, 
                    e.created_at
                FROM bgoi_enquiries e
                WHERE NOT EXISTS (
                    SELECT 1 FROM leads l 
                    WHERE l.source = 'Mobile App (Live)' 
                      AND l.student_name = e.candidate_name 
                      AND l.created_at = e.created_at
                )
            ) AS combined
        `;

        let where = ' WHERE is_active = 1';
        const params = [];

        // 1. Enforce Domain Security for non-SuperAdmins
        if (!isSuperAdmin) {
            const { domain: userDomains } = req.user;
            const authorizedAliases = getDomainAliases(userDomains);

            if (domain && domain !== 'All') {
                const requestedAliases = getDomainAliases(domain);
                const hasAccess = requestedAliases.every(a => authorizedAliases.includes(a));
                if (!hasAccess) {
                    return res.status(403).json({ error: 'Access denied to this domain' });
                }
                where = appendDomainCondition(where, params, domain);
            } else {
                where = appendDomainCondition(where, params, userDomains);
            }
        } else if (domain && domain !== 'All') {
            where = appendDomainCondition(where, params, domain);
        }

        // 2. Enforce Assignment Security for Staff
        if (isStaff) {
            where += ' AND assigned_to = ?';
            params.push(req.user.id);
        } else if (assigned_to && assigned_to !== 'All') {
            where += ' AND assigned_to = ?';
            params.push(Number(assigned_to));
        }

        // 3. Additional Filters
        if (status && status !== 'All') {
            const statuses = status.split(',').map(s => s.trim());
            if (statuses.length === 1) {
                where += ' AND status = ?';
                params.push(statuses[0]);
            } else {
                where += ` AND status IN (${statuses.map(() => '?').join(', ')})`;
                params.push(...statuses);
            }
        }
        if (payment_status && payment_status !== 'All') {
            where += ' AND payment_status = ?';
            params.push(payment_status);
        }
        if (invalid_reason && invalid_reason !== 'All') {
            where += ' AND invalid_reason = ?';
            params.push(invalid_reason);
        }
        if (source && source !== 'All') {
            where += ' AND (source = ? OR source LIKE ?)';
            params.push(source, `%${source}%`);
        }

        // 4. Date Range Filters
        if (today === '1') {
            where += " AND DATE(created_at) = CURDATE()";
        } else if (date) {
            where += " AND DATE(created_at) = ?";
            params.push(date);
        } else if (startDate && endDate) {
            where += " AND DATE(created_at) BETWEEN ? AND ?";
            params.push(startDate, endDate);
        }

        // 5. Search
        const q = String(search || '').trim();
        if (q) {
            const like = `%${q}%`;
            where += ` AND (
                student_name LIKE ? OR
                email LIKE ? OR
                phone LIKE ? OR
                domain LIKE ? OR
                lead_code LIKE ? OR
                status LIKE ? OR
                remarks LIKE ? OR
                source LIKE ?
            )`;
            params.push(like, like, like, like, like, like, like, like);
        }

        // 6. View Specifics
        if (view === 'pending') {
            where += ` AND (assigned_to IS NULL OR TRIM(COALESCE(remarks, '')) = '') AND status != 'Enrolled'`;
        } else if (view === 'payment') {
            where += ` AND payment_status IN ('Advance payment', 'Partial Payment', 'Full payment', 'No Fee')`;
        } else if (view === 'invalid') {
            where += ` AND status = 'Invalid'`;
        }

        const countSql = `SELECT COUNT(*) AS total FROM ${combinedBase} ${where}`;
        const [countRows] = await pool.execute(countSql, params);
        const total = countRows[0]?.total || 0;

        const listSql = `
            SELECT *, (SELECT subject FROM lead_remarks_messages WHERE lead_id = combined.id ORDER BY created_at DESC, id DESC LIMIT 1) as latest_remark_subject
            FROM ${combinedBase}
            ${where}
            ORDER BY ${safeSortBy} ${safeSortOrder}
            LIMIT ? OFFSET ?
        `;
        const [rows] = await pool.execute(listSql, [...params, limitNum, offset]);

        return res.json({
            leads: rows,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
        });
    } catch (err) {
        console.error("BGI Leads API ERROR:", err.message);
        return res.status(500).json({ error: err.message });
    }
});
// Update Remarks
app.put('/api/leads/remarks', authenticateToken, async (req, res) => {
    const { leadId, remarks } = req.body;
    const userName = req.user?.name || 'Staff'; // Use fallback to prevent SQL crash
    try {
        const [beforeRows] = await pool.execute('SELECT remarks FROM leads WHERE id = ?', [leadId]);
        const oldRemarks = beforeRows[0]?.remarks || '';
        // 1. Update the lead first (The most important part)
        await pool.execute('UPDATE leads SET remarks = ? WHERE id = ?', [remarks || '', leadId]);
        // 2. Try to log history (Wrapped in its own try/catch so it doesn't break the main save)
        const nowStr = getISTString();
        try {
            await pool.execute(
                'INSERT INTO remarks_history (lead_id, old_remarks, new_remarks, changed_by, changed_at) VALUES (?, ?, ?, ?, ?)',
                [leadId, oldRemarks, remarks || '', userName, nowStr]
            );
            await pool.execute(
                `INSERT INTO lead_edit_history (lead_id, action_type, field_name, old_value, new_value, changed_by, changed_at)
                 VALUES (?, 'REMARKS_UPDATE', 'remarks', ?, ?, ?, ?)`,
                [leadId, oldRemarks, remarks || '', userName, nowStr]
            );
        } catch (historyErr) {
            console.error("History log failed, but remarks were saved:", historyErr.message);
        }
        // 3. Send a clean JSON response
        return res.status(200).json({
            success: true,
            msg: "Remarks updated successfully",
            remarks: remarks
        });
    } catch (err) {
        console.error("Main Update Error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});
// Dashboard Summary
app.get('/api/dashboard/summary', authenticateToken, async (req, res) => {
    const { id, role, domain } = req.user;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    try {
        let leadsQuery = 'SELECT * FROM leads WHERE is_active = 1';
        let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE is_active = 1';
        // Find your existing statsQuery inside app.get('/api/dashboard/summary')
        // REPLACE it with this version:
        let statsQuery = `SELECT 
    -- Lifetime Stats
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'Follow Up' THEN 1 END) as followUp,
    COUNT(CASE WHEN status = 'Enrolled' THEN 1 END) as enrolled,
    -- Today's Stats
    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as todayTotal,
    COUNT(CASE WHEN DATE(created_at) = CURDATE() AND status = 'Follow Up' THEN 1 END) as todayFollowUp,
    COUNT(CASE WHEN DATE(created_at) = CURDATE() AND status = 'Enrolled' THEN 1 END) as todayEnrolled
    FROM leads WHERE is_active = 1`;
        let params = [];
        let countParams = [];
        if (!isSuperAdminUser(req.user)) {
            if (getUserTier(req.user) === 'ADMIN') {
                leadsQuery = appendDomainCondition(leadsQuery, params, domain);
                countQuery = appendDomainCondition(countQuery, countParams, domain);
                statsQuery = appendDomainCondition(statsQuery, countParams, domain);
            } else {
                leadsQuery += ' AND assigned_to = ?';
                countQuery += ' AND assigned_to = ?';
                statsQuery += ' AND assigned_to = ?';
                params.push(id);
                countParams.push(id);
            }
        }
        leadsQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limitNum, offset);
        const [leads] = await pool.execute(leadsQuery, params);
        const [countResult] = await pool.execute(countQuery, countParams);
        const [stats] = await pool.execute(statsQuery, countParams);
        const total = countResult[0].total;

        res.json({
            leads,
            stats: stats[0],
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Fetch TLs for a domain (for multi-TL selection)
app.get('/api/tl-list', authenticateToken, async (req, res) => {
    try {
        const { domain: userDomain } = req.user;
        const { domain: queryDomain } = req.query;

        // Determine which domain(s) to filter by
        const filterDomain = (queryDomain && queryDomain !== 'All')
            ? queryDomain
            : (!isSuperAdminUser(req.user) ? userDomain : null);

        let query = `
            SELECT u.id, u.name, u.role, u.tier
            FROM users u
            LEFT JOIN master_user_hierarchy h ON h.role_name = u.role
            WHERE u.is_active = 1 
            AND (COALESCE(h.tier, 'ADMIN') IN ('ADMIN', 'SUPER_ADMIN'))
        `;
        let params = [];
        // Only TL/Management can see other management personnel
        if (!isAdminUser(req.user)) {
            return res.status(403).json({ msg: "Unauthorized" });
        }

        // Filter by domain
        if (filterDomain) {
            query = appendDomainCondition(query, params, filterDomain);
        }

        query += ' ORDER BY u.name ASC';
        const [tls] = await pool.execute(query, params);
        res.json(tls);
    } catch (err) {
        console.error("Fetch TLs Error:", err);
        res.status(500).json({ error: "Could not fetch management users" });
    }
});
// Fetch Staff for TL
app.get('/api/staff-list', authenticateToken, async (req, res) => {
    try {
        const { domain: userDomain } = req.user;
        const { domain: queryDomain } = req.query;

        // Determine which domain(s) to filter by
        const filterDomain = (queryDomain && queryDomain !== 'All')
            ? queryDomain
            : (!isSuperAdminUser(req.user) ? userDomain : null);

        let query = `
            SELECT u.id, u.employee_id, u.name, u.domain, u.tier
            FROM users u
            LEFT JOIN master_user_hierarchy h ON h.role_name = u.role
            WHERE u.is_active = 1 AND COALESCE(h.tier, 'STAFF') = 'STAFF'
        `;
        const params = [];

        if (filterDomain) {
            // Get all aliases for the requested domain (e.g. "Overseas" → ["Overseas", "Bluestone Overseas", ...])
            const aliases = getDomainAliases(filterDomain);
            // Use LIKE matching so that staff with comma-separated domains
            // (e.g. "Overseas, IAS Academy") still appear for each domain they belong to
            const likeClauses = aliases.map(() => 'u.domain LIKE ?').join(' OR ');
            query += ` AND (${likeClauses})`;
            aliases.forEach(alias => params.push(`%${alias}%`));
        }

        query += ' ORDER BY u.name ASC';
        const [staff] = await pool.execute(query, params);
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch staff" });
    }
});
// Assign Lead
app.post('/api/leads/assign', authenticateToken, async (req, res) => {
    const { leadId, staffId, staffName } = req.body;
    if (!isAdminUser(req.user)) {
        return res.status(403).json({ msg: "Unauthorized" });
    }
    try {
        // Get the assigner's name from the authenticated user
        const [assignerData] = await pool.execute('SELECT name FROM users WHERE id = ? AND is_active = 1', [req.user.id]);
        const assignerName = assignerData[0]?.name || 'Unknown';

        const [beforeRows] = await pool.execute(
            'SELECT assigned_to_name FROM leads WHERE id = ?',
            [leadId]
        );
        const oldAssignedTo = beforeRows[0]?.assigned_to_name || '';
        await pool.execute(
            'UPDATE leads SET assigned_to = ?, assigned_to_name = ?, assigned_by = ?, assigned_by_name = ? WHERE id = ?',
            [staffId, staffName, req.user.id, assignerName, leadId]
        );
        const nowStr = getISTString();
        await pool.execute(
            `INSERT INTO lead_edit_history (lead_id, action_type, field_name, old_value, new_value, changed_by, changed_at)
             VALUES (?, 'ASSIGNMENT_UPDATE', 'assigned_to_name', ?, ?, ?, ?)`,
            [leadId, oldAssignedTo, staffName || '', assignerName, nowStr]
        );
        res.json({ msg: "Lead assigned successfully" });
    } catch (err) {
        res.status(500).json({ error: "Assignment failed" });
    }
});
// Auto-assign leads that don't have assigned_by info yet (for backward compatibility)
app.get('/api/leads/assign-by/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        // Find ADMIN-tier user(s) for this staff member's domain
        const [staffData] = await pool.execute('SELECT domain FROM users WHERE id = ? AND is_active = 1', [userId]);
        if (staffData.length === 0) return res.status(404).json({ error: "Staff not found" });

        const staffDomain = staffData[0].domain;

        // Find ALL ADMIN-tier users in the same domain
        const [tlData] = await pool.execute(
            `SELECT u.id, u.name
             FROM users u
             LEFT JOIN master_user_hierarchy h ON h.role_name = u.role
             WHERE u.domain = ? AND u.is_active = 1 AND COALESCE(h.tier, 'STAFF') = 'ADMIN'`,
            [staffDomain]
        );

        // If only 1 ADMIN in domain, auto-assign
        if (tlData.length === 1) {
            const tlId = tlData[0].id;
            const tlName = tlData[0].name;

            // Update any unassigned leads for this staff to have the ADMIN as assigned_by
            await pool.execute(
                'UPDATE leads SET assigned_by = ?, assigned_by_name = ? WHERE assigned_to = ? AND assigned_by IS NULL',
                [tlId, tlName, userId]
            );
            res.json({ msg: "Leads updated", tl: tlName });
        } else if (tlData.length > 1) {
            // If multiple ADMIN users, return the list and let frontend handle it
            res.json({ msg: "Multiple admins in domain", tls: tlData, staffId: userId });
        } else {
            res.json({ msg: "No admin found in domain" });
        }
    } catch (err) {
        res.status(500).json({ error: "Auto-assign failed" });
    }
});
app.get('/api/search/live', authenticateToken, async (req, res) => {
    const { q } = req.query;
    const { domain: userDomain, id: userId } = req.user;
    try {
        const query = (q || '').trim();
        if (!query) return res.json([]);
        const like = `%${query}%`;
        let sql = `
            SELECT 
                id, student_name, domain, phone, email, source, category, interested_in, 
                status, assigned_to_name, assigned_by_name, remarks, lead_code, created_at,
                (SELECT subject FROM lead_remarks_messages WHERE lead_id = leads.id ORDER BY created_at DESC, id DESC LIMIT 1) as latest_remark_subject
            FROM leads 
            WHERE is_active = 1 AND (
                student_name LIKE ? OR
                phone LIKE ? OR
                email LIKE ? OR
                domain LIKE ? OR
                source LIKE ? OR
                category LIKE ? OR
                interested_in LIKE ? OR
                status LIKE ? OR
                assigned_to_name LIKE ? OR
                assigned_by_name LIKE ? OR
                remarks LIKE ? OR
                lead_code LIKE ? OR
                CAST(id AS CHAR) LIKE ?
            )
        `;
        let params = [
            like, like, like, like, like,
            like, like, like, like, like,
            like, like, like
        ];
        if (isStaffUser(req.user)) {
            sql += " AND assigned_to = ?";
            params.push(userId);
        } else if (!isSuperAdminUser(req.user)) {
            sql = appendDomainCondition(sql, params, userDomain);
        }
        const [rows] = await pool.execute(
            sql + " ORDER BY created_at DESC LIMIT 25",
            params
        );
        res.json(rows);
    } catch (err) {
        console.error("LIVE SEARCH ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/leads/bulk', authenticateToken, async (req, res) => {
    const { leads } = req.body; // Array of lead objects

    if (!leads || !Array.isArray(leads)) {
        return res.status(400).json({ error: "No data provided" });
    }
    const connection = await pool.getConnection();
    try {
        const skipped = [];
        const uniqueLeads = [];
        const seenInFile = new Set();

        for (const l of leads) {
            const normDom = normalizeContactDomain(String(l.domain || '').trim());
            const phone = String(l.phone || '').trim();

            if (!phone || !normDom) {
                skipped.push({ name: l.student_name, phone, domain: normDom, reason: "Missing phone or domain" });
                continue;
            }

            const combo = `${phone}|${normDom}`;
            if (seenInFile.has(combo)) {
                skipped.push({ name: l.student_name, phone, domain: normDom, reason: "Duplicate in import file" });
                continue;
            }
            seenInFile.add(combo);

            const [existing] = await pool.execute(
                'SELECT id FROM leads WHERE phone = ? AND domain = ? LIMIT 1',
                [phone, normDom]
            );

            if (existing.length > 0) {
                skipped.push({ name: l.student_name, phone, domain: normDom, reason: "Already exists in database" });
                continue;
            }

            uniqueLeads.push({ ...l, domain: normDom });
        }

        if (uniqueLeads.length === 0) {
            return res.json({
                message: "No new leads to import",
                count: 0,
                skippedCount: skipped.length,
                skipped
            });
        }

        await connection.beginTransaction();
        const nowStr = getISTString();

        // Use a loop or batch query for codes to avoid huge concurrency
        const values = [];
        for (const l of uniqueLeads) {
            const leadCode = await getNextLeadCode(l.domain);
            values.push([
                l.student_name,
                l.email,
                l.phone,
                l.domain,
                l.source || 'Bulk Import',
                l.category,
                l.interested_in,
                l.remarks,
                leadCode,
                'New',
                1,
                l.assigned_to || null,
                l.assigned_to_name || null,
                l.assigned_by || null,
                l.assigned_by_name || null,
                nowStr
            ]);
        }

        const sql = `
            INSERT INTO leads 
            (student_name, email, phone, domain, source, category, interested_in, remarks, lead_code, status, is_active, assigned_to, assigned_to_name, assigned_by, assigned_by_name, created_at) 
            VALUES ?
        `;
        await connection.query(sql, [values]);
        await connection.commit();

        res.json({
            message: `Imported ${values.length} leads successfully.`,
            count: values.length,
            skippedCount: skipped.length,
            skipped
        });
    } catch (err) {
        console.error("BULK IMPORT ERROR:", err);
        if (connection && typeof connection.rollback === 'function') {
            try { await connection.rollback(); } catch (rbErr) { console.error("Rollback failed:", rbErr.message); }
        }
        res.status(500).json({ error: "Database error during bulk import: " + err.message });
    } finally {
        if (connection) connection.release();
    }
});
app.get('/api/leads/domain/:domainName', authenticateToken, async (req, res) => {
    const { domainName } = req.params;
    const {
        page = 1,
        limit = 10,
        category = 'All',
        interest = 'All',
        status = 'All',
        search = '',
        assigned_to = 'All',
        sortBy = 'created_at',
        sortOrder = 'desc',
        today,
        date,
        startDate,
        endDate
    } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    const { role, id: userId, domain: userDomain } = req.user;
    try {
        let where = 'WHERE is_active = 1';
        let params = [];
        // ✅ FIXED DOMAIN MATCH (NO NORMALIZE HERE)
        const aliases = getDomainAliases(domainName);
        where += ` AND domain IN (${aliases.map(() => '?').join(', ')})`;
        params.push(...aliases);
        // ROLE
        if (isStaffUser(req.user)) {
            where += ' AND assigned_to = ?';
            params.push(userId);
        } else if (assigned_to && assigned_to !== 'All') {
            where += ' AND assigned_to = ?';
            params.push(Number(assigned_to));
        }
        // SEARCH
        if (search.trim()) {
            const like = `%${search}%`;
            where += ` AND (
                student_name LIKE ? OR
                phone LIKE ? OR
                email LIKE ? OR
                lead_code LIKE ? OR
                remarks LIKE ? OR
                source LIKE ?
            )`;
            params.push(like, like, like, like, like, like);
        }
        // FILTERS
        if (status !== 'All') {
            const statuses = status.split(',').map(s => s.trim());
            if (statuses.length === 1) {
                where += ' AND status = ?';
                params.push(statuses[0]);
            } else {
                where += ` AND status IN (${statuses.map(() => '?').join(', ')})`;
                params.push(...statuses);
            }
        }
        if (category !== 'All') {
            where += ' AND category = ?';
            params.push(category);
        }
        if (interest !== 'All') {
            where += ' AND interested_in = ?';
            params.push(interest);
        }
        if (req.query.payment_status && req.query.payment_status !== 'All') {
            const ps = req.query.payment_status;
            if (ps === 'Advance payment,Partial Payment,Full payment,No Fee' || ps === 'payment') {
                where += " AND payment_status IN ('Advance payment', 'Partial Payment', 'Full payment', 'No Fee')";
            } else {
                where += ' AND payment_status = ?';
                params.push(ps);
            }
        }

        // DATE FILTERS
        if (today === '1') {
            where += " AND DATE(created_at) = CURDATE()";
        } else if (date) {
            where += " AND DATE(created_at) = ?";
            params.push(date);
        } else if (startDate && endDate) {
            where += " AND DATE(created_at) BETWEEN ? AND ?";
            params.push(startDate, endDate);
        }

        const validSortBy = [
            'created_at', 'student_name', 'phone', 'email', 'status', 'category', 'interested_in', 'lead_code'
        ].includes(sortBy) ? sortBy : 'created_at';
        const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
        const [countRows] = await pool.execute(
            `SELECT COUNT(*) as total FROM leads ${where}`,
            params
        );
        const [rows] = await pool.execute(
            `SELECT *, (SELECT subject FROM lead_remarks_messages WHERE lead_id = leads.id ORDER BY created_at DESC, id DESC LIMIT 1) as latest_remark_subject
             FROM leads
             ${where}
             ORDER BY ${validSortBy} ${validSortOrder}
             LIMIT ? OFFSET ?`,
            [...params, limitNum, offset]
        );
        res.json({
            leads: rows,
            pagination: {
                total: countRows[0].total,
                currentPage: pageNum,
                totalPages: Math.ceil(countRows[0].total / limitNum),
                pageSize: limitNum
            }
        });
    } catch (err) {
        console.error("DOMAIN ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/leads/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM leads WHERE id = ? AND is_active = 1',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: "Lead not found" });
        }
        const lead = rows[0];
        if (!canUserAccessLead(lead, req.user)) {
            return res.status(403).json({ message: "Access denied" });
        }
        res.json(lead);
    } catch (err) {
        console.error("Lead details fetch error:", err);
        res.status(500).json({ error: "Failed to fetch lead details" });
    }
});

// Bulk Assign Leads
app.post('/api/leads/bulk-assign', authenticateToken, async (req, res) => {
    const { leadIds, staffId, staffName } = req.body;
    if (!isAdminUser(req.user)) {
        return res.status(403).json({ msg: "Unauthorized" });
    }
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ msg: "No lead IDs provided" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Get the assigner's name
        const [assignerData] = await connection.execute('SELECT name FROM users WHERE id = ? AND is_active = 1', [req.user.id]);
        const assignerName = assignerData[0]?.name || 'Unknown';

        for (const leadId of leadIds) {
            // Get previous assignment for history
            const [beforeRows] = await connection.execute(
                'SELECT assigned_to_name FROM leads WHERE id = ?',
                [leadId]
            );
            const oldAssignedTo = beforeRows[0]?.assigned_to_name || '';

            // Update lead
            await connection.execute(
                'UPDATE leads SET assigned_to = ?, assigned_to_name = ?, assigned_by = ?, assigned_by_name = ? WHERE id = ?',
                [staffId, staffName, req.user.id, assignerName, leadId]
            );

            const nowStr = getISTString();
            // Add to history
            await connection.execute(
                `INSERT INTO lead_edit_history (lead_id, action_type, field_name, old_value, new_value, changed_by, changed_at)
                 VALUES (?, 'ASSIGNMENT_UPDATE', 'assigned_to_name', ?, ?, ?, ?)`,
                [leadId, oldAssignedTo, staffName || '', assignerName, nowStr]
            );
        }

        await connection.commit();
        res.json({ msg: `${leadIds.length} lead(s) assigned successfully` });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("BULK ASSIGN ERROR:", err);
        res.status(500).json({ error: "Bulk assignment failed" });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/leads/:id/domain-staff', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [leadRows] = await pool.execute(
            'SELECT id, domain, assigned_to, is_active FROM leads WHERE id = ? AND is_active = 1',
            [id]
        );
        if (leadRows.length === 0) return res.status(404).json({ msg: 'Lead not found' });
        const lead = leadRows[0];
        if (!canUserAccessLead(lead, req.user)) return res.status(403).json({ msg: 'Access denied' });
        const aliases = getDomainAliases(lead.domain);
        if (aliases.length === 0) return res.json([]);
        // Use LIKE matching so multi-domain staff (e.g. "Overseas, IAS Academy") 
        // appear in the list for each of their domains
        const likeClauses = aliases.map(() => 'u.domain LIKE ?').join(' OR ');
        const likeParams = aliases.map(a => `%${a}%`);
        const [rows] = await pool.execute(
            `SELECT u.id, u.employee_id, u.name, u.email, u.phone, u.role, u.domain
             FROM users u
             LEFT JOIN master_user_hierarchy h ON h.role_name = u.role
             WHERE u.is_active = 1
               AND (
                 (COALESCE(h.tier, 'STAFF') IN ('STAFF', 'ADMIN') AND (${likeClauses}))
                 OR LOWER(u.role) IN ('main admin', 'md', 'gm', 'super admin')
                 OR LOWER(u.tier) = 'super_admin'
               )
             ORDER BY (LOWER(u.tier) = 'super_admin' OR LOWER(u.role) IN ('main admin', 'md', 'gm', 'super admin')) DESC, u.role DESC, u.name ASC`,
            likeParams
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Could not fetch domain staff' });
    }
});

app.get('/api/leads/:id/remark-messages', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [leadRows] = await pool.execute(
            'SELECT id, domain, assigned_to, is_active FROM leads WHERE id = ? AND is_active = 1',
            [id]
        );
        if (leadRows.length === 0) return res.status(404).json({ msg: 'Lead not found' });
        const lead = leadRows[0];
        if (!canUserAccessLead(lead, req.user)) return res.status(403).json({ msg: 'Access denied' });
        const [rows] = await pool.execute(
            `SELECT
        id,
        ref_id,
        subject,
        description,
        attachment_base64,
        attachment_name,
        attachment_type,
        sent_status,
        created_at,
        updated_at
      FROM lead_remarks_messages
      WHERE lead_id = ?
      ORDER BY created_at DESC`,
            [id]
        );

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Could not fetch remark messages' });
    }
});
app.get('/api/remark-message-history/:messageId', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const [rows] = await pool.execute(
            `SELECT
        id,
        message_id,
        subject,
        description,
        edited_by,
        edited_at
       FROM lead_remarks_messages_history
       WHERE message_id = ?
       ORDER BY edited_at DESC`,
            [messageId]
        );
        res.json(rows);
    } catch (err) {
        console.error("History fetch error:", err);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});
app.post('/api/leads/:id/remark-messages/send', authenticateToken, async (req, res) => {
    const { id } = req.params;
    let {
        ref_id,
        subject,
        description,
        recipientUserIds = [],
        systemRecipientIds = [],
        primaryRecipientId = null,
        includeCandidateBCC = true,
        attachment_base64,
        attachment_name,
        attachment_type
    } = req.body;
    // Safe parse recipient ids
    try {
        if (typeof recipientUserIds === "string") recipientUserIds = JSON.parse(recipientUserIds);
        if (typeof systemRecipientIds === "string") systemRecipientIds = JSON.parse(systemRecipientIds);
    } catch {
        recipientUserIds = [];
        systemRecipientIds = [];
    }
    if (!subject || !description) {
        return res.status(400).json({
            msg: "subject and description are required"
        });
    }
    try {
        const [leadRows] = await pool.execute(
            `SELECT id, lead_code, student_name, email, domain, assigned_to, is_active
       FROM leads
       WHERE id = ? AND is_active = 1`,
            [id]
        );
        if (leadRows.length === 0) {
            return res.status(404).json({ msg: "Lead not found" });
        }
        const lead = leadRows[0];
        if (!canUserAccessLead(lead, req.user)) {
            return res.status(403).json({ msg: "Access denied" });
        }
        const resolvedRefId = lead.lead_code || String(lead.id);

        // Normalize internal staff IDs
        const normalizedIds = Array.from(
            new Set(
                (Array.isArray(recipientUserIds) ? recipientUserIds : [])
                    .map((v) => Number(v))
                    .filter((v) => Number.isInteger(v) && v > 0)
            )
        );
        let staffRows = [];
        if (normalizedIds.length > 0) {
            const idPlaceholders = normalizedIds.map(() => "?").join(",");
            const domainAliases = getDomainAliases(lead.domain);
            const domainLikeClauses = domainAliases.map(() => "u.domain LIKE ?").join(" OR ");
            const domainLikeParams = domainAliases.map((a) => `%${a}%`);

            const [rows] = await pool.execute(
                `SELECT u.id, u.name, u.email, u.phone, u.role, u.domain
          FROM users u
          LEFT JOIN master_user_hierarchy h ON h.role_name = u.role
          WHERE u.is_active = 1
          AND (
             (COALESCE(h.tier, 'STAFF') IN ('STAFF', 'ADMIN') AND (${domainLikeClauses}))
             OR u.role = 'Super Admin'
          )
          AND u.id IN (${idPlaceholders})`,
                [...domainLikeParams, ...normalizedIds]
            );
            staffRows = rows;
        }

        // --- NEW: FETCH SYSTEM MANAGED EMAILS ---
        let systemEmails = [];
        let primaryEmail = null;

        const normSystemIds = Array.from(
            new Set(
                (Array.isArray(systemRecipientIds) ? systemRecipientIds : [])
                    .map((v) => Number(v))
                    .filter((v) => Number.isInteger(v) && v > 0)
            )
        );

        // Fetch System Recipients
        const allSystemIds = [...new Set([
            ...normSystemIds,
            ...(primaryRecipientId ? [Number(primaryRecipientId)] : [])
        ])].filter(v => v > 0);

        if (allSystemIds.length > 0) {
            const qm = allSystemIds.map(() => "?").join(",");
            const [sysRows] = await pool.execute(
                `SELECT id, email FROM system_emails WHERE id IN (${qm}) AND is_active = 1`,
                allSystemIds
            );

            sysRows.forEach(r => {
                if (primaryRecipientId && Number(r.id) === Number(primaryRecipientId)) {
                    primaryEmail = r.email;
                } else if (normSystemIds.includes(Number(r.id))) {
                    systemEmails.push(r.email);
                }
            });
        }

        const staffEmails = staffRows.map(u => u.email).filter(Boolean);
        const candidateEmail = lead.email;
        const [superAdmins] = await pool.execute(
            `SELECT email, name, role FROM users 
             WHERE (LOWER(role) IN ('main admin', 'md', 'gm', 'super admin') OR LOWER(tier) = 'super_admin') 
               AND is_active = 1`
        );
        const superAdminEmails = superAdmins.map(u => u.email).filter(Boolean);

        const allCCEmails = [...new Set([...staffEmails, ...superAdminEmails, ...systemEmails])];

        const finalTo = primaryEmail || "bluestoneocs@gmail.com";
        const finalCC = allCCEmails.length > 0 ? allCCEmails.join(",") : null;
        const finalBCC = includeCandidateBCC && candidateEmail ? candidateEmail : null;

        console.log("--- REMARK EMAIL DEBUG ---");
        console.log("TO (Dev):", finalTo);
        console.log("CC (Staff/Admins/SuperAdmin):", finalCC);
        console.log("BCC (Candidate):", finalBCC);
        console.log("--------------------------");
        const createdBy = formatWho(req.user);
        // Email HTML
        const html = `
      <div style="font-family: Arial, sans-serif;">
        <h3>Lead Remark Update</h3>
        <p><strong>Ref ID:</strong> ${lead.lead_code}</p>
        <p><strong>Candidate:</strong> ${lead.student_name || ""}</p>
        <p><strong>Domain:</strong> ${lead.domain || ""}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Sent By:</strong> ${createdBy}</p>
        <p><strong>Description:</strong><br/>
        ${description.replace(/\n/g, "<br/>")}
        </p>
      </div>
    `;
        let sentStatus = "FAILED";
        let sentError = "";
        const transporter = createMailTransporter();
        if (!transporter) {
            sentError = "SMTP not configured";
        } else {
            try {
                const mailOptions = {
                    from: SMTP_CONFIG.from || SMTP_CONFIG.user,
                    to: finalTo,
                    cc: finalCC,
                    bcc: finalBCC,
                    subject: `[Lead ${lead.lead_code || lead.id}] ${subject}`,
                    html
                };
                // Attach file if present
                if (attachment_base64) {
                    const base64Data = attachment_base64.split("base64,")[1];
                    mailOptions.attachments = [
                        {
                            filename: attachment_name || "attachment",
                            content: base64Data,
                            encoding: "base64",
                            contentType: attachment_type
                        }
                    ];
                }
                await transporter.sendMail(mailOptions);
                sentStatus = "SENT";
            } catch (mailErr) {
                sentError = `Mail send failed: ${mailErr.message}`;
            }
        }
        const nowStr = getISTString();
        // Save to database
        await pool.execute(
            `INSERT INTO lead_remarks_messages
      (
        lead_id,
        ref_id,
        subject,
        description,
        recipient_user_ids,
        recipient_emails,
        candidate_email,
        sent_status,
        sent_error,
        created_by,
        attachment_base64,
        attachment_name,
        attachment_type,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                resolvedRefId,
                subject,
                description,
                JSON.stringify(normalizedIds),
                staffEmails.join(","),
                candidateEmail,
                sentStatus,
                sentError || null,
                createdBy,
                attachment_base64 || null,
                attachment_name || null,
                attachment_type || null,
                nowStr
            ]
        );
        if (sentStatus !== "SENT") {
            return res.status(400).json({
                msg: `Saved, but mail not sent: ${sentError}`
            });
        }

        return res.status(201).json({
            msg: "Remark saved and mail sent"
        });
    } catch (err) {
        console.error("Remark send route error:", err);
        return res.status(500).json({
            error: "Failed to save/send remark message",
            details: err.message
        });
    }
});
app.put('/api/leads/:id/remark-messages/:messageId',
    authenticateToken,
    async (req, res) => {
        const { id, messageId } = req.params;
        const {
            ref_id,
            subject,
            description,
            recipientUserIds = [],
            includeCandidateBCC = true,
            attachment_base64,
            attachment_name,
            attachment_type
        } = req.body;
        if (!subject || !description) {
            return res.status(400).json({ msg: 'subject and description are required' });
        }
        try {
            const [leadRows] = await pool.execute(
                'SELECT id, lead_code, student_name, email, domain, assigned_to, is_active FROM leads WHERE id = ? AND is_active = 1',
                [id]
            );
            if (leadRows.length === 0) return res.status(404).json({ msg: 'Lead not found' });
            const lead = leadRows[0];
            if (!canUserAccessLead(lead, req.user)) return res.status(403).json({ msg: 'Access denied' });
            const resolvedRefId = lead.lead_code || String(lead.id);
            const [msgRows] = await pool.execute(
                'SELECT * FROM lead_remarks_messages WHERE id = ? AND lead_id = ?',
                [messageId, id]
            );
            if (msgRows.length === 0) {
                return res.status(404).json({ msg: 'Message not found' });
            }
            const oldMessage = msgRows[0];
            // 🔹 Save old message into history
            await pool.execute(
                `INSERT INTO lead_remarks_messages_history
    (message_id, lead_id, ref_id, subject, description,
     attachment_base64, attachment_name, attachment_type, edited_by, edited_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    oldMessage.id,
                    oldMessage.lead_id,
                    oldMessage.ref_id,
                    oldMessage.subject,
                    oldMessage.description,
                    oldMessage.attachment_base64,
                    oldMessage.attachment_name,
                    oldMessage.attachment_type,
                    formatWho(req.user),
                    getISTString()
                ]
            );
            if (msgRows.length === 0) return res.status(404).json({ msg: 'Message not found' });
            const normalizedIds = Array.from(
                new Set((Array.isArray(recipientUserIds) ? recipientUserIds : [])
                    .map((v) => Number(v))
                    .filter((v) => Number.isInteger(v) && v > 0))
            );
            let staffRows = [];
            if (normalizedIds.length > 0) {
                const idPlaceholders = normalizedIds.map(() => "?").join(",");
                const domainAliases = getDomainAliases(lead.domain);
                const domainLikeClauses = domainAliases.map(() => "u.domain LIKE ?").join(" OR ");
                const domainLikeParams = domainAliases.map((a) => `%${a}%`);

                console.log("Searching BCC (Edit) for domain aliases:", domainAliases);

                const [rows] = await pool.execute(
                    `SELECT u.id, u.name, u.email, u.phone, u.role, u.domain
                 FROM users u
                 LEFT JOIN master_user_hierarchy h ON h.role_name = u.role
                 WHERE u.is_active = 1
                   AND (
                     (COALESCE(h.tier, 'STAFF') IN ('STAFF', 'ADMIN') AND (${domainLikeClauses}))
                     OR u.role = 'Super Admin'
                   )
                   AND u.id IN (${idPlaceholders})`,
                    [...domainLikeParams, ...normalizedIds]
                );
                staffRows = rows;
                console.log(`Found ${staffRows.length} valid BCC recipients (Edit)`);
            }
            const staffEmails = staffRows.map(u => u.email).filter(Boolean);
            const candidateEmail = String(lead.email || '').trim();
            const [superAdmins] = await pool.execute(
                `SELECT email FROM users 
                 WHERE (LOWER(role) IN ('main admin', 'md', 'gm', 'super admin') OR LOWER(tier) = 'super_admin') 
                   AND is_active = 1`
            );
            const superAdminEmails = superAdmins.map(u => u.email).filter(Boolean);
            console.log(`Found ${superAdminEmails.length} super admins for CC (Edit):`, superAdminEmails);

            const allCCEmails = [...new Set([...staffEmails, ...superAdminEmails])];

            const finalTo = "bluestoneocs@gmail.com";
            const finalCC = allCCEmails.length > 0 ? allCCEmails.join(",") : null;
            const finalBCC = includeCandidateBCC && candidateEmail ? candidateEmail : null;

            console.log("--- REMARK EMAIL EDIT DEBUG ---");
            console.log("TO (Dev):", finalTo);
            console.log("CC (Staff/Admins/SuperAdmin):", finalCC);
            console.log("BCC (Candidate):", finalBCC);
            console.log("-------------------------------");
            const createdBy = formatWho(req.user);
            const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h3>Lead Remark Update (Edited)</h3>
                <p><strong>Ref ID:</strong> ${String(lead.lead_code)}</p>
                <p><strong>Candidate:</strong> ${String(lead.student_name || '')}</p>
                <p><strong>Domain:</strong> ${String(lead.domain || '')}</p>
                <p><strong>Subject:</strong> ${String(subject)}</p>
                <p><strong>Edited & Sent By:</strong> ${createdBy}</p>
                <p><strong>Description:</strong><br/>${String(description).replace(/\n/g, '<br/>')}</p>
            </div>
        `;
            let sentStatus = 'FAILED';
            let sentError = '';
            const transporter = createMailTransporter();
            if (!transporter) {
                sentError = 'SMTP is not configured on server';
            } else {
                try {
                    const mailOptions = {
                        from: SMTP_CONFIG.from || SMTP_CONFIG.user,
                        to: finalTo,
                        cc: finalCC,
                        bcc: finalBCC,
                        subject: `[Lead ${lead.lead_code || lead.id}] ${subject}`,
                        html
                    };
                    if (attachment_base64) {
                        const base64Data = attachment_base64.split("base64,")[1] || attachment_base64;
                        mailOptions.attachments = [{
                            filename: attachment_name || "attachment",
                            content: base64Data,
                            encoding: "base64",
                            contentType: attachment_type
                        }];
                    }
                    await transporter.sendMail(mailOptions);
                    sentStatus = 'SENT';
                } catch (mailErr) {
                    sentError = `Mail send failed: ${mailErr.message}`;
                }
            }
            await pool.execute(
                `UPDATE lead_remarks_messages
             SET ref_id = ?, subject = ?, description = ?, recipient_user_ids = ?, recipient_emails = ?, candidate_email = ?, sent_status = ?, sent_error = ?, created_by = ?, attachment_base64 = ?, attachment_name = ?, attachment_type = ?, updated_at = ?
             WHERE id = ? AND lead_id = ?`,
                [
                    resolvedRefId,
                    String(subject).trim(),
                    String(description).trim(),
                    JSON.stringify(staffRows.map((u) => u.id)),
                    staffEmails.join(','),
                    candidateEmail || null,
                    sentStatus,
                    sentError || null,
                    formatWho(req.user),
                    attachment_base64 || null,
                    attachment_name || null,
                    attachment_type || null,
                    getISTString(),
                    messageId,
                    id
                ]
            );
            if (sentStatus !== 'SENT') {
                return res.status(400).json({ msg: `Updated, but mail not sent: ${sentError}` });
            }
            return res.json({ msg: 'Updated and mail re-sent' });
        } catch (err) {
            console.error('Remark update route error:', err.message);
            return res.status(500).json({ error: 'Failed to update/send remark message', details: err.message });
        }
    });
app.delete('/api/leads/:id/remark-messages/:messageId', authenticateToken, async (req, res) => {
    const { id, messageId } = req.params;
    try {
        const [leadRows] = await pool.execute(
            'SELECT id, domain, assigned_to, is_active FROM leads WHERE id = ? AND is_active = 1',
            [id]
        );
        if (leadRows.length === 0) return res.status(404).json({ msg: 'Lead not found' });
        const lead = leadRows[0];
        if (!canUserAccessLead(lead, req.user)) return res.status(403).json({ msg: 'Access denied' });
        const [result] = await pool.execute(
            'DELETE FROM lead_remarks_messages WHERE id = ? AND lead_id = ?',
            [messageId, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ msg: 'Message not found' });
        return res.json({ msg: 'Remark message deleted' });
    } catch (err) {
        console.error('Remark delete route error:', err.message);
        return res.status(500).json({ error: 'Failed to delete remark message', details: err.message });
    }
});
app.get('/api/leads/remark-history/:messageId', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const [rows] = await pool.execute(
            `SELECT *
       FROM lead_remarks_messages_history
       WHERE message_id=?
       ORDER BY edited_at DESC`,
            [messageId]
        );
        res.json(rows);
    } catch (err) {
        console.error("History fetch error:", err);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});
// --- NOTIFICATION / LIVE FEED ROUTES ---
// 1. Get all active notifications
app.get('/api/notifications/all', authenticateToken, async (req, res) => {
    try {
        // Use [rows] to destructure the result from mysql2/promise
        const [rows] = await pool.execute(
            `SELECT id, date, message, is_active, flag, created_at, updated_at,
                    COALESCE(NULLIF(updated_by, ''), NULLIF(created_by, ''), 'System') AS updated_by
             FROM notifications
             WHERE flag = 1
             ORDER BY date DESC, id DESC`
        );

        // Ensure we ALWAYS return an array, even if empty
        res.json(Array.isArray(rows) ? rows : []);
    } catch (err) {
        console.error("DATABASE CRASH:", err.message);
        // If the table is missing, this is where it fails
        res.status(500).json({ error: "Table might be missing", details: err.message });
    }
});
// 2. Create Notification (allow multiple notifications for same date)
app.post('/api/notifications', authenticateToken, async (req, res) => {
    const { date, message } = req.body;
    const { role } = req.user;
    const actorName = req.user?.name || req.user?.email || "System";
    // Optional: Restrict to Admins/TLs if you don't want Staff posting broadcasts
    if (!isAdminUser(req.user)) {
        return res.status(403).json({ msg: "Not authorized to post broadcasts" });
    }
    if (!date || !message) {
        return res.status(400).json({ error: "Date and message are required" });
    }
    try {
        const nowStr = getISTString();
        // Always insert a new row, even if same date exists.
        const [result] = await pool.execute(
            'INSERT INTO notifications (date, message, flag, is_active, created_by, updated_by, created_at, updated_at) VALUES (?, ?, 1, 1, ?, ?, ?, ?)',
            [date, message, actorName, actorName, nowStr, nowStr]
        );
        const newId = result.insertId;

        await pool.execute(
            'INSERT INTO notifications_history (notification_id, action_type, new_message, new_date, new_is_active, changed_by, changed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [newId, 'CREATED', message, date, 1, actorName, nowStr]
        );
        res.status(201).json({ msg: "Notification created successfully" });
    } catch (err) {
        console.error("Create notification error:", err.message);
        res.status(500).json({ error: "Database error" });
    }
});
app.put('/api/notifications/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { message, date, is_active } = req.body;
    const actorName = req.user?.name || req.user?.email || "System";
    try {
        const [oldRows] = await pool.execute('SELECT message, date, is_active FROM notifications WHERE id = ? AND flag = 1', [id]);
        if (oldRows.length === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }
        const oldData = oldRows[0];
        const nowStr = getISTString();
        const [result] = await pool.execute(
            `UPDATE notifications 
       SET message = ?, date = ?, is_active = ?, updated_by = ?, updated_at = ? 
       WHERE id = ?`,
            [message, date, is_active ?? 1, actorName, nowStr, id]
        );
        await pool.execute(
            'INSERT INTO notifications_history (notification_id, action_type, old_message, new_message, old_date, new_date, old_is_active, new_is_active, changed_by, changed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, 'UPDATED', oldData.message, message, oldData.date, date, oldData.is_active, is_active ?? 1, actorName, nowStr]
        );
        res.json({ success: true, message: "Updated successfully" });
    } catch (err) {
        console.error("UPDATE ERROR:", err.message);
        res.status(500).json({ error: "Database error", details: err.message });
    }
});
// 3. Soft Delete (Archive) Notification
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // We do a soft delete by setting flag to 0
        const [result] = await pool.execute(
            'UPDATE notifications SET flag = 0 WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "Notification not found" });
        }
        const actorName = req.user?.name || req.user?.email || "System";
        const nowStr = getISTString();
        await pool.execute(
            'INSERT INTO notifications_history (notification_id, action_type, changed_by, changed_at) VALUES (?, ?, ?, ?)',
            [id, 'DELETED', actorName, nowStr]
        );
        res.json({ msg: "Notification archived successfully" });
    } catch (err) {
        console.error("Delete notification error:", err.message);
        res.status(500).json({ error: "Failed to archive notification" });
    }
});
app.patch('/api/notifications/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    const actorName = req.user?.name || req.user?.email || "System";
    try {
        const [oldRows] = await pool.execute('SELECT is_active FROM notifications WHERE id = ?', [id]);
        if (oldRows.length === 0) return res.status(404).json({ error: "Notification not found" });
        const oldIsActive = oldRows[0].is_active;
        const nowStr = getISTString();
        await pool.execute(
            `UPDATE notifications 
       SET is_active = ?, updated_by = ?, updated_at = ? 
       WHERE id = ?`,
            [is_active, actorName, nowStr, id]
        );
        await pool.execute(
            'INSERT INTO notifications_history (notification_id, action_type, old_is_active, new_is_active, changed_by, changed_at) VALUES (?, ?, ?, ?, ?, ?)',
            [id, 'STATUS_TOGGLED', oldIsActive, is_active, actorName, nowStr]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("TOGGLE ERROR:", err.message);
        res.status(500).json({ error: "Toggle failed" });
    }
});
app.get('/api/notifications/:id/history', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM notifications_history WHERE notification_id = ? ORDER BY changed_at DESC`,
            [id]
        );
        res.json(rows);
    } catch (err) {
        console.error("HISTORY ERROR:", err.message);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});
// GET: Fetch ALL messages for a specific date
app.get('/api/notifications', authenticateToken, async (req, res) => {
    const { date } = req.query;
    try {
        const [rows] = await pool.execute(
            `SELECT id, date, message, is_active, flag, created_at, updated_at,
              COALESCE(NULLIF(updated_by, ''), NULLIF(created_by, ''), 'System') AS updated_by
       FROM notifications 
       WHERE DATE(date) = ? AND is_active = 1 AND flag = 1
       ORDER BY created_at DESC, id DESC`,
            [date]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Toggle active status
app.put("/api/notifications/toggle/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute(`
      UPDATE notifications 
      SET is_active = NOT is_active 
      WHERE id = ?
    `, [id]);
        res.json({ message: "Status updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
// GET: Fetch notification-date counts for a month (YYYY-MM) for calendar badges
app.get('/api/notifications/calendar', authenticateToken, async (req, res) => {
    const { month } = req.query; // YYYY-MM
    const start = `${month}-01`;
    const end = `${month}-31`;
    try {
        const [rows] = await pool.execute(
            `SELECT DATE(date) as date_key, COUNT(*) as count
       FROM notifications
       WHERE date BETWEEN ? AND ?
       AND flag = 1
       AND is_active = 1
       GROUP BY DATE(date)
       ORDER BY DATE(date) ASC`,
            [start, end]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Search Leads
app.get('/api/search', authenticateToken, async (req, res) => {
    const { query, page = 1, limit = 10 } = req.query;
    if (!query || query.trim().length < 1) return res.json([]);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    try {
        const like = `%${query}%`;
        const [rows] = await pool.execute(
            `SELECT * FROM leads WHERE is_active = 1 AND (student_name LIKE ? OR phone LIKE ? OR email LIKE ? OR domain LIKE ?) ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [like, like, like, like, limitNum, offset]
        );
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM leads WHERE is_active = 1 AND (student_name LIKE ? OR phone LIKE ? OR email LIKE ? OR domain LIKE ?)`,
            [like, like, like, like]
        );
        const total = countResult[0].total;

        res.json({
            leads: rows,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
});
// Get Remarks History for a Lead
app.get('/api/remarks-history/:leadId', authenticateToken, async (req, res) => {
    const { leadId } = req.params;
    try {
        const [history] = await pool.execute(
            `SELECT id, lead_id, old_remarks, new_remarks, changed_by, changed_at 
             FROM remarks_history 
             WHERE lead_id = ? 
             ORDER BY changed_at DESC`,
            [leadId]
        );
        res.json(history);
    } catch (err) {
        console.error('Error fetching remarks history:', err);
        res.status(500).json({ error: 'Failed to fetch remarks history' });
    }
});
app.get('/api/history/leads/:leadId', authenticateToken, async (req, res) => {
    const { leadId } = req.params;
    try {
        const [rows] = await pool.execute(
            `SELECT id, lead_id, action_type, field_name, old_value, new_value, changed_by, changed_at
             FROM lead_edit_history
             WHERE lead_id = ?
             ORDER BY changed_at DESC, id DESC`,
            [leadId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch lead history' });
    }
});
app.get('/api/history/users/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await pool.execute(
            `SELECT id, user_id, action_type, field_name, old_value, new_value, changed_by, changed_at
             FROM user_edit_history
             WHERE user_id = ?
             ORDER BY changed_at DESC, id DESC`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user history' });
    }
});
// Update User Profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    // Destructure exactly what frontend sends
    const { name, phone, avatarBase64, oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    try {
        // 1. Handle Password Change - only if both fields are provided
        if (newPassword && oldPassword) {
            const [rows] = await pool.execute('SELECT password FROM users WHERE id = ? AND is_active = 1', [userId]);
            if (rows.length === 0) return res.status(404).json({ msg: "User not found" });
            const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
            if (!isMatch) return res.status(400).json({ msg: "Old password incorrect" });
            const salt = await bcrypt.hash(newPassword, 10);
            await pool.execute('UPDATE users SET password = ? WHERE id = ? AND is_active = 1', [salt, userId]);
        }
        // 2. Update Profile Info
        // We use COALESCE or simple logic to ensure we don't overwrite with NULL if values are missing
        await pool.execute(
            'UPDATE users SET name = ?, phone = ?, avatar = ? WHERE id = ? AND is_active = 1',
            [name, phone, avatarBase64 || null, userId]
        );
        // 3. Return updated user
        const [updated] = await pool.execute(
            'SELECT id, name, email, phone, role, domain, avatar FROM users WHERE id = ? AND is_active = 1',
            [userId]
        );

        res.json({ msg: "Profile Updated", user: updated[0] });
    } catch (err) {
        console.error("SERVER ERROR:", err); // Look for this in your terminal!
        res.status(500).json({ error: err.message || "Update failed" });
    }
});
// Verify User Password (for lock screen, etc.)
app.post('/api/auth/verify-password', authenticateToken, async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) return res.status(400).json({ msg: "Password required" });
    try {
        const [rows] = await pool.execute('SELECT password FROM users WHERE id = ? AND is_active = 1', [userId]);
        if (rows.length === 0) return res.status(404).json({ msg: "User not found" });
        const isMatch = await bcrypt.compare(password, rows[0].password);
        if (!isMatch) return res.status(401).json({ msg: "Incorrect password" });
        res.json({ msg: "Password verified" });
    } catch (err) {
        console.error("Verify Password Error:", err);
        res.status(500).json({ error: "Verification failed" });
    }
});
// --- NEW: STAFF MANAGEMENT ROUTES ---
// 1. Fetch ALL Staff (For the Admin Directory)
// Example fix in server.js
app.get('/api/staff-directory', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, employee_id, name, role, tier, designation, domain, phone, email, avatar, is_active, last_active_at, TIMESTAMPDIFF(SECOND, last_active_at, CURRENT_TIMESTAMP) AS seconds_since_active FROM users WHERE deleted_at IS NULL ORDER BY id DESC'
        );
        if (isSuperAdminUser(req.user)) {
            return res.json(rows);
        }
        if (!isAdminUser(req.user)) {
            return res.status(403).json({ msg: "Unauthorized to view staff directory." });
        }
        const allowed = getDomainAliases(req.user?.domain || '').map((d) => String(d).trim().toLowerCase());
        const filtered = rows.filter((u) => {
            const domains = String(u.domain || '')
                .split(',')
                .map((d) => d.trim().toLowerCase())
                .filter(Boolean);
            // Admins should not see "All" users
            if (domains.includes('all')) return false;
            const isStaff = deriveTierFromRole(u.role) === 'STAFF';
            if (!isStaff) return false;
            return domains.some((d) => allowed.includes(d));
        });
        res.json(filtered);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 1b. Toggle Staff Active Status
app.patch('/api/staff/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    // Security: Only Admins can toggle status
    if (!isAdminUser(req.user)) {
        return res.status(403).json({ msg: "Unauthorized to update staff status." });
    }

    if (parseInt(id, 10) === req.user.id && Number(is_active) === 0) {
        return res.status(400).json({ msg: "You cannot deactivate your own account." });
    }

    try {
        const [beforeRows] = await pool.execute(
            'SELECT name, tier, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        if (beforeRows.length === 0) return res.status(404).json({ msg: "User not found" });
        const before = beforeRows[0];

        // Security: Regular Admins can ONLY manage STAFF tier
        if (!isSuperAdminUser(req.user) && getUserTier(before) !== 'STAFF') {
            return res.status(403).json({ msg: "Admins can only manage Staff tier accounts" });
        }
        await pool.execute(
            'UPDATE users SET is_active = ? WHERE id = ? AND deleted_at IS NULL',
            [
                Number(is_active) ? 1 : 0,
                id
            ]
        );
        const changedBy = req.user?.name || 'System';
        await pool.execute(
            `INSERT INTO user_edit_history (user_id, action_type, field_name, old_value, new_value, changed_by, changed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                'USER_STATUS',
                'is_active',
                String(before.is_active),
                String(Number(is_active) ? 1 : 0),
                changedBy,
                getISTString()
            ]
        );
        res.json({ msg: "Staff status updated" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update staff status" });
    }
});
// 2. Delete Staff Member
app.delete('/api/staff/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ msg: "You cannot delete your own account." });
    }

    // Security: Only Admins can delete
    if (!isAdminUser(req.user)) {
        return res.status(403).json({ msg: "Unauthorized to delete staff." });
    }

    try {
        const [beforeRows] = await pool.execute(
            'SELECT name, tier, role FROM users WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        if (beforeRows.length === 0) return res.status(404).json({ msg: "Staff member not found" });
        const before = beforeRows[0];

        // Security: Regular Admins can ONLY delete STAFF tier
        if (!isSuperAdminUser(req.user) && getUserTier(before) !== 'STAFF') {
            return res.status(403).json({ msg: "Admins can only manage Staff tier accounts" });
        }
        const deletedBy = req.user?.id && req.user?.name
            ? `(${req.user.id}) ${req.user.name}`
            : (req.user?.name || 'System');
        const [result] = await pool.execute(
            'UPDATE users SET is_active = 0, deleted_at = NOW(), deleted_by = ? WHERE id = ? AND deleted_at IS NULL',
            [deletedBy, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "Staff member not found or already deleted" });
        }
        res.json({ msg: "Staff member soft-deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});
// 3. Edit Staff Member (Update role/domain/phone)
app.put('/api/staff/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { employee_id, name, email, phone, role, tier, designation, domain, password } = req.body;

    // Security: Only Admins can edit
    if (!isAdminUser(req.user)) {
        return res.status(403).json({ msg: "Access Denied" });
    }

    try {
        const [beforeRows] = await pool.execute(
            'SELECT employee_id, name, email, phone, role, tier, designation, domain FROM users WHERE id = ? AND is_active = 1',
            [id]
        );
        if (beforeRows.length === 0) return res.status(404).json({ msg: "User not found" });
        const before = beforeRows[0];

        // Security: Regular Admins can ONLY manage STAFF tier
        if (!isSuperAdminUser(req.user)) {
            if (getUserTier(before) !== 'STAFF') return res.status(403).json({ msg: "Admins can only manage Staff tier accounts" });
            if (tier && tier !== 'STAFF') return res.status(403).json({ msg: "Access Denied: Only Super Admins can elevate account tiers" });
        }
        // 1. Optional: Check if the new email is already used by another user
        if (email) {
            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, id]
            );
            if (existing.length > 0) {
                return res.status(400).json({ msg: "Email is already in use by another staff member" });
            }
        }
        let query = 'UPDATE users SET employee_id = ?, name = ?, email = ?, phone = ?, role = ?, tier = ?, designation = ?, domain = ?';
        let params = [
            employee_id || null,
            name,
            email,
            phone,
            role,
            (tier !== undefined && tier !== null) ? tier : before.tier,
            designation || null,
            domain
        ];
        // 2. Only hash and update password if it's provided
        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(hashedPassword);
        }
        query += ' WHERE id = ? AND is_active = 1';
        params.push(id);
        const [result] = await pool.execute(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "User not found" });
        }

        const changedBy = req.user?.name || 'System';
        const nowStr = getISTString();
        const historyRows = [];

        // Log changes
        if ((before.employee_id || '') !== (employee_id || '')) historyRows.push([id, 'USER_EDIT', 'employee_id', before.employee_id || '', employee_id || '', changedBy, nowStr]);
        if ((before.name || '') !== (name || '')) historyRows.push([id, 'USER_EDIT', 'name', before.name || '', name || '', changedBy, nowStr]);
        if ((before.email || '') !== (email || '')) historyRows.push([id, 'USER_EDIT', 'email', before.email || '', email || '', changedBy, nowStr]);
        if ((before.phone || '') !== (phone || '')) historyRows.push([id, 'USER_EDIT', 'phone', before.phone || '', phone || '', changedBy, nowStr]);
        if ((before.role || '') !== (role || '')) historyRows.push([id, 'USER_EDIT', 'role', before.role || '', role || '', changedBy, nowStr]);
        if ((before.tier || '') !== (tier || '')) historyRows.push([id, 'USER_EDIT', 'tier', before.tier || '', tier || '', changedBy, nowStr]);
        if ((before.designation || '') !== (designation || '')) historyRows.push([id, 'USER_EDIT', 'designation', before.designation || '', designation || '', changedBy, nowStr]);
        if ((before.domain || '') !== (domain || '')) historyRows.push([id, 'USER_EDIT', 'domain', before.domain || '', domain || '', changedBy, nowStr]);

        if (password && password.trim() !== "") historyRows.push([id, 'PASSWORD_RESET', 'password', '********', '********', changedBy, nowStr]);

        for (const h of historyRows) {
            await pool.execute(
                `INSERT INTO user_edit_history (user_id, action_type, field_name, old_value, new_value, changed_by, changed_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                h
            );
        }

        // Return the updated data to verify
        const [rows] = await pool.execute('SELECT id, name, email, phone, role, tier, designation, domain FROM users WHERE id = ?', [id]);

        res.json({ msg: "Staff updated successfully", user: rows[0] });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ error: "Database update failed: " + err.message });
    }
});
// ==========================================
// 1. DOMAIN ROUTES
// ==========================================
// Get all domains
app.get('/api/master/domains', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM master_domains ORDER BY COALESCE(sequence, 999999), name ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// Create new domain
app.post('/api/master/domains', authenticateToken, async (req, res) => {
    if (!isSuperAdminUser(req.user)) return res.status(403).json({ msg: "Super admin only" });
    const { name, icon_type, icon_name, logo_url, submenus, sequence } = req.body;
    const safeSequence = Number.isFinite(Number(sequence)) ? Number(sequence) : null;
    const safeIconType = ['default', 'react_icon', 'logo'].includes(icon_type) ? icon_type : 'default';
    const safeIconName = safeIconType === 'react_icon' ? (icon_name || null) : null;
    const safeLogoUrl = safeIconType === 'logo' ? (logo_url || null) : null;
    const safeSubmenus = JSON.stringify(
        Array.isArray(submenus)
            ? submenus
                .filter((x) => x && typeof x.name === 'string' && typeof x.path === 'string')
                .map((x) => ({ name: x.name.trim(), path: x.path.trim() }))
                .filter((x) => x.name && x.path)
            : []
    );
    try {
        await pool.execute(
            'INSERT INTO master_domains (name, sequence, icon_type, icon_name, logo_url, submenus) VALUES (?, ?, ?, ?, ?, ?)',
            [name, safeSequence, safeIconType, safeIconName, safeLogoUrl, safeSubmenus]
        );
        res.json({ msg: "Domain created" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// Edit Domain
app.put('/api/master/domains/:id', authenticateToken, async (req, res) => {
    const { name, icon_type, icon_name, logo_url, submenus, sequence } = req.body;
    const safeSequence = Number.isFinite(Number(sequence)) ? Number(sequence) : null;
    const safeIconType = ['default', 'react_icon', 'logo'].includes(icon_type) ? icon_type : null;
    const safeIconName = safeIconType === 'react_icon' ? (icon_name || null) : null;
    const safeLogoUrl = safeIconType === 'logo' ? (logo_url || null) : null;
    const safeSubmenus = Array.isArray(submenus)
        ? JSON.stringify(
            submenus
                .filter((x) => x && typeof x.name === 'string' && typeof x.path === 'string')
                .map((x) => ({ name: x.name.trim(), path: x.path.trim() }))
                .filter((x) => x.name && x.path)
        )
        : null;
    try {
        if (safeIconType) {
            if (Array.isArray(submenus)) {
                await pool.execute(
                    'UPDATE master_domains SET name = ?, sequence = ?, icon_type = ?, icon_name = ?, logo_url = ?, submenus = ? WHERE id = ?',
                    [name, safeSequence, safeIconType, safeIconName, safeLogoUrl, safeSubmenus, req.params.id]
                );
            } else {
                await pool.execute(
                    'UPDATE master_domains SET name = ?, sequence = ?, icon_type = ?, icon_name = ?, logo_url = ? WHERE id = ?',
                    [name, safeSequence, safeIconType, safeIconName, safeLogoUrl, req.params.id]
                );
            }
        } else {
            await pool.execute('UPDATE master_domains SET name = ?, sequence = ? WHERE id = ?', [name, safeSequence, req.params.id]);
        }
        res.json({ msg: "Domain Updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// Delete Domain
app.delete('/api/master/domains/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('DELETE FROM master_domains WHERE id = ?', [req.params.id]);
        res.json({ msg: "Domain and all associated data deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// ==========================================
// 2. CATEGORY ROUTES (Step 2)
// ==========================================
app.post('/api/master/categories', authenticateToken, async (req, res) => {
    const { domain_id, name } = req.body;
    try {
        await pool.execute('INSERT INTO master_categories (domain_id, category_name) VALUES (?, ?)', [domain_id, name]);
        res.json({ msg: "Category Added" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/master/categories/:id', authenticateToken, async (req, res) => {
    const { name } = req.body;
    try {
        await pool.execute('UPDATE master_categories SET category_name = ? WHERE id = ?', [name, req.params.id]);
        res.json({ msg: "Category Updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/master/categories/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('DELETE FROM master_categories WHERE id = ?', [req.params.id]);
        res.json({ msg: "Category deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// ==========================================
// 4. SYSTEM EMAIL ROUTES (Managed Mail IDs)
// ==========================================
app.get('/api/master/system-emails', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM system_emails ORDER BY label ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/master/system-emails', authenticateToken, async (req, res) => {
    if (!isSuperAdminUser(req.user)) return res.status(403).json({ msg: "Super admin only" });
    const { label, email } = req.body;
    if (!label || !email) return res.status(400).json({ msg: "Label and Email are required" });
    try {
        const nowStr = getISTString();
        await pool.execute(
            'INSERT INTO system_emails (label, email, is_active, created_at) VALUES (?, ?, 1, ?)',
            [label.trim(), email.trim(), nowStr]
        );
        res.json({ msg: "System email added" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/master/system-emails/:id', authenticateToken, async (req, res) => {
    if (!isSuperAdminUser(req.user)) return res.status(403).json({ msg: "Super admin only" });
    const { label, email, is_active } = req.body;
    try {
        await pool.execute(
            'UPDATE system_emails SET label = ?, email = ?, is_active = ? WHERE id = ?',
            [label.trim(), email.trim(), is_active ?? 1, req.params.id]
        );
        res.json({ msg: "System email updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/master/system-emails/:id', authenticateToken, async (req, res) => {
    if (!isSuperAdminUser(req.user)) return res.status(403).json({ msg: "Super admin only" });
    try {
        await pool.execute('DELETE FROM system_emails WHERE id = ?', [req.params.id]);
        res.json({ msg: "System email deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 5. VALUE ROUTES (Step 3 - Sub-values)
// ==========================================
app.post('/api/master/values', authenticateToken, async (req, res) => {
    const { category_id, value } = req.body;
    try {
        await pool.execute('INSERT INTO master_values (category_id, sub_value) VALUES (?, ?)', [category_id, value]);
        res.json({ msg: "Value Added" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/master/values/bulk', authenticateToken, async (req, res) => {
    const { category_id, values } = req.body;
    if (!category_id || !Array.isArray(values) || values.length === 0) {
        return res.status(400).json({ msg: "category_id and an array of values are required" });
    }

    // Clean and deduplicate values
    const uniqueValues = [...new Set(values.map(v => v ? v.toString().trim() : '').filter(v => v !== ''))];
    if (uniqueValues.length === 0) {
        return res.status(400).json({ msg: "No valid values provided" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // We do a simple loop here. Performance for a few hundred items is fine.
        for (const val of uniqueValues) {
            // Optional: You could check if it exists first to prevent duplicates per category
            await connection.execute(
                'INSERT INTO master_values (category_id, sub_value) VALUES (?, ?)',
                [category_id, val]
            );
        }

        await connection.commit();
        res.json({ msg: `${uniqueValues.length} Values Added` });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Bulk insert Error:", err);
        res.status(500).json({ error: "Failed to upload bulk values", details: err.message });
    } finally {
        if (connection) connection.release();
    }
});
app.put('/api/master/values/:id', authenticateToken, async (req, res) => {
    const { sub_value } = req.body;
    try {
        await pool.execute('UPDATE master_values SET sub_value = ? WHERE id = ?', [sub_value, req.params.id]);
        res.json({ msg: "Value Updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/master/values/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('DELETE FROM master_values WHERE id = ?', [req.params.id]);
        res.json({ msg: "Value deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// ==========================================
// 4. USER HIERARCHY ROUTES
// ==========================================
app.get('/api/master/user-hierarchy', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, tier, role_name, is_active FROM master_user_hierarchy ORDER BY FIELD(tier, "SUPER_ADMIN","ADMIN","STAFF"), role_name'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/master/user-hierarchy', authenticateToken, async (req, res) => {
    if (!isSuperAdminUser(req.user)) {
        return res.status(403).json({ msg: "Unauthorized" });
    }
    const { tier, role_name, is_active } = req.body;
    if (!['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(tier) || !role_name) {
        return res.status(400).json({ msg: "Invalid payload" });
    }
    try {
        await pool.execute(
            'INSERT INTO master_user_hierarchy (tier, role_name, is_active) VALUES (?, ?, ?)',
            [tier, role_name, is_active === 0 ? 0 : 1]
        );
        res.json({ msg: "Hierarchy role added" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.put('/api/master/user-hierarchy/:id', authenticateToken, async (req, res) => {
    if (!isSuperAdminUser(req.user)) {
        return res.status(403).json({ msg: "Unauthorized" });
    }
    const { tier, role_name, is_active } = req.body;
    if (!['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(tier) || !role_name) {
        return res.status(400).json({ msg: "Invalid payload" });
    }
    try {
        await pool.execute(
            'UPDATE master_user_hierarchy SET tier = ?, role_name = ?, is_active = ? WHERE id = ?',
            [tier, role_name, Number(is_active) ? 1 : 0, req.params.id]
        );
        res.json({ msg: "Hierarchy role updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.delete('/api/master/user-hierarchy/:id', authenticateToken, async (req, res) => {
    if (!isSuperAdminUser(req.user)) {
        return res.status(403).json({ msg: "Unauthorized" });
    }
    try {
        await pool.execute('DELETE FROM master_user_hierarchy WHERE id = ?', [req.params.id]);
        res.json({ msg: "Hierarchy role deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================================
// 5. THE MASTER VIEW (Full Structure)
// ==========================================
app.get('/api/master/full-structure', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                d.id as domainId, d.name as domainName, d.sequence as domainSequence, d.icon_type as domainIconType, d.icon_name as domainIconName, d.logo_url as domainLogoUrl, d.submenus as domainSubmenus,
                c.id as catId, c.category_name as catName,
                v.id as valId, v.sub_value as valName
            FROM master_domains d
            LEFT JOIN master_categories c ON d.id = c.domain_id
            LEFT JOIN master_values v ON c.id = v.category_id
            ORDER BY COALESCE(d.sequence, 999999), d.name, c.category_name
        `);
        const structure = rows.reduce((acc, row) => {
            let domain = acc.find(d => d.id === row.domainId);
            if (!domain) {
                domain = {
                    id: row.domainId,
                    name: row.domainName,
                    sequence: row.domainSequence ?? null,
                    icon_type: row.domainIconType || 'default',
                    icon_name: row.domainIconName || null,
                    logo_url: row.domainLogoUrl || null,
                    submenus: (() => {
                        try {
                            const parsed = JSON.parse(row.domainSubmenus || '[]');
                            return Array.isArray(parsed) ? parsed : [];
                        } catch {
                            return [];
                        }
                    })(),
                    categories: []
                };
                acc.push(domain);
            }
            if (row.catId) {
                let cat = domain.categories.find(c => c.id === row.catId);
                if (!cat) {
                    cat = { id: row.catId, category_name: row.catName, values: [] };
                    domain.categories.push(cat);
                }
                if (row.valId) {
                    cat.values.push({ id: row.valId, sub_value: row.valName });
                }
            }
            return acc;
        }, []);
        res.json(structure);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// DELETE LEAD
// Note: Changed 'verifyToken' to 'authenticateToken' to match your error logs
app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { remarks } = req.body; // Can accept remarks from body
    try {
        const deletedBy = req.user?.id && req.user?.name
            ? `(${req.user.id}) ${req.user.name}`
            : (req.user?.name || 'System');
        // Soft delete: keep row in DB and just mark it inactive
        const [result] = await pool.query(
            'UPDATE leads SET is_active = 0, deleted_at = NOW(), deleted_by = ?, deleted_remarks = ? WHERE id = ?',
            [deletedBy, remarks || null, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Lead not found" });
        }
        res.status(200).json({ message: "Lead soft-deleted successfully" });
    } catch (err) {
        console.error("DATABASE ERROR:", err);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
});

// RESTORE LEAD (Super Admin Only)
app.patch('/api/leads/:id/restore', authenticateToken, async (req, res) => {
    const { id } = req.params;
    if (!isSuperAdminUser(req.user)) {
        return res.status(403).json({ msg: "Unauthorized to restore leads." });
    }
    try {
        const [result] = await pool.query(
            'UPDATE leads SET is_active = 1, deleted_at = NULL, deleted_by = NULL WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Lead not found" });
        }
        res.status(200).json({ message: "Lead restored successfully" });
    } catch (err) {
        console.error("RESTORE ERROR:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// BULK RESTORE LEADS (Super Admin Only)
app.patch('/api/admin/leads/bulk-restore', authenticateToken, async (req, res) => {
    const { ids } = req.body;
    if (!isSuperAdminUser(req.user)) {
        return res.status(403).json({ msg: "Unauthorized for bulk restoration." });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ msg: "No lead IDs provided." });
    }
    try {
        const [result] = await pool.query(
            'UPDATE leads SET is_active = 1, deleted_at = NULL, deleted_by = NULL WHERE id IN (?) AND is_active = 0',
            [ids]
        );
        res.status(200).json({ message: `${result.affectedRows} records restored successfully.` });
    } catch (err) {
        console.error("BULK RESTORE ERROR:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// PERMANENTLY DELETE LEADS (Super Admin Only)
app.delete('/api/admin/leads/permanent-delete', authenticateToken, async (req, res) => {
    const { ids } = req.body;
    if (!isSuperAdminUser(req.user)) {
        return res.status(403).json({ msg: "Unauthorized for permanent deletion." });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ msg: "No lead IDs provided." });
    }
    try {
        // Clean up associated data across all related tables
        await pool.query('DELETE FROM lead_documents WHERE lead_id IN (?)', [ids]);
        await pool.query('DELETE FROM lead_remarks_messages WHERE lead_id IN (?)', [ids]);
        await pool.query('DELETE FROM lead_remarks_messages_history WHERE lead_id IN (?)', [ids]);
        await pool.query('DELETE FROM lead_edit_history WHERE lead_id IN (?)', [ids]);
        
        const [result] = await pool.query('DELETE FROM leads WHERE id IN (?) AND is_active = 0', [ids]);
        res.status(200).json({ message: `${result.affectedRows} records permanently deleted.` });
    } catch (err) {
        console.error("PERMANENT DELETE ERROR:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// FETCH DELETED LEADS (Super Admin Only)
app.get('/api/admin/deleted-leads', authenticateToken, async (req, res) => {
    if (!isSuperAdminUser(req.user)) {
        return res.status(403).json({ msg: "Unauthorized access." });
    }
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM leads WHERE is_active = 0 ORDER BY deleted_at DESC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// DOCUMENT MANAGEMENT SYSTEM
// ==========================================

// 1. MASTER DOCUMENTATION (New System)
app.get('/api/master/documents', authenticateToken, async (req, res) => {
    try {
        const [docs] = await pool.execute('SELECT * FROM master_documentation ORDER BY document_name ASC');
        const [mappings] = await pool.execute('SELECT * FROM master_documentation_mappings');
        
        const result = docs.map(d => ({
            ...d,
            access_configs: mappings.filter(m => m.doc_id === d.id)
        }));
        
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/master/documents', authenticateToken, async (req, res) => {
    if (!isAdminUser(req.user)) return res.status(403).json({ msg: "Admin only" });
    const { documentName, isMandatory, access_configs } = req.body;
    
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO master_documentation (document_name, is_mandatory) VALUES (?, ?)',
            [documentName, isMandatory ? 1 : 0]
        );
        const docId = result.insertId;

        if (access_configs && access_configs.length > 0) {
            for (const cfg of access_configs) {
                await connection.query(
                    'INSERT INTO master_documentation_mappings (doc_id, domain_id, category_id, value_id) VALUES (?, ?, ?, ?)',
                    [docId, cfg.domain_id || null, cfg.category_id || null, cfg.value_id || null]
                );
            }
        }

        await connection.commit();
        res.json({ msg: "Document added successfully", id: docId });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

app.put('/api/master/documents/:id', authenticateToken, async (req, res) => {
    if (!isAdminUser(req.user)) return res.status(403).json({ msg: "Admin only" });
    const { id } = req.params;
    const { documentName, isMandatory, access_configs } = req.body;
    
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.query(
            'UPDATE master_documentation SET document_name = ?, is_mandatory = ? WHERE id = ?',
            [documentName, isMandatory ? 1 : 0, id]
        );

        // Delete old mappings and insert new ones
        await connection.query('DELETE FROM master_documentation_mappings WHERE doc_id = ?', [id]);

        if (access_configs && access_configs.length > 0) {
            for (const cfg of access_configs) {
                await connection.query(
                    'INSERT INTO master_documentation_mappings (doc_id, domain_id, category_id, value_id) VALUES (?, ?, ?, ?)',
                    [id, cfg.domain_id || null, cfg.category_id || null, cfg.value_id || null]
                );
            }
        }

        await connection.commit();
        res.json({ msg: "Document updated successfully" });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

app.delete('/api/master/documents/:id', authenticateToken, async (req, res) => {
    if (!isAdminUser(req.user)) return res.status(403).json({ msg: "Admin only" });
    try {
        await pool.execute('DELETE FROM master_documentation WHERE id = ?', [req.params.id]);
        res.json({ msg: "Document deleted successfully" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Legacy backward compatibility for old UI if needed (Optional, but let's remove if we are fully refactoring)
app.get('/api/master/documents/:level/:parentId', authenticateToken, async (req, res) => {
    const { level, parentId } = req.params;
    try {
        // Return documents from the new system that match this specific level
        let sql = `
            SELECT d.* 
            FROM master_documentation d
            JOIN master_documentation_mappings m ON d.id = m.doc_id
            WHERE `;
        
        let params = [];
        if (level === 'domain') {
            sql += 'm.domain_id = ? AND m.category_id IS NULL AND m.value_id IS NULL';
            params.push(parentId);
        } else if (level === 'category') {
            sql += 'm.category_id = ? AND m.value_id IS NULL';
            params.push(parentId);
        } else if (level === 'value') {
            sql += 'm.value_id = ?';
            params.push(parentId);
        }

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. LEAD DOCUMENTS management
app.get('/api/leads/:id/documents', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM lead_documents WHERE lead_id = ? ORDER BY uploaded_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/leads/:id/document-requirements', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get lead details
        const [leadRows] = await pool.execute(
            'SELECT domain, category, interested_in FROM leads WHERE id = ?',
            [id]
        );
        if (leadRows.length === 0) return res.status(404).json({ msg: "Lead not found" });
        const lead = leadRows[0];

        // 2. Resolve IDs for each level using flexible matching
        const normalizedDomain = normalizeContactDomain(lead.domain);

        // Domain ID
        const [domainRows] = await pool.execute(
            'SELECT id FROM master_domains WHERE LOWER(name) LIKE LOWER(?) OR LOWER(?) LIKE CONCAT("%", LOWER(name), "%")', 
            [`%${normalizedDomain}%`, normalizedDomain]
        );
        const domainId = domainRows[0]?.id;

        // Category ID
        let categoryId = null;
        if (lead.category && lead.category !== 'Mobile Enquiry') {
            const [catRows] = await pool.execute(
                'SELECT id FROM master_categories WHERE LOWER(category_name) LIKE LOWER(?) OR LOWER(?) LIKE CONCAT("%", LOWER(category_name), "%")', 
                [`%${lead.category}%`, lead.category]
            );
            categoryId = catRows[0]?.id;
        }

        // Value ID (Interested In)
        let valueId = null;
        if (lead.interested_in) {
            const [valRows] = await pool.execute(
                'SELECT id FROM master_values WHERE LOWER(sub_value) LIKE LOWER(?) OR LOWER(?) LIKE CONCAT("%", LOWER(sub_value), "%")', 
                [`%${lead.interested_in}%`, lead.interested_in]
            );
            valueId = valRows[0]?.id;
        }

        console.log(`[DocMatch] Lead ${id}: Domain(${lead.domain} -> ${normalizedDomain} -> ID:${domainId}), Cat(${lead.category} -> ID:${categoryId}), Val(${lead.interested_in} -> ID:${valueId})`);

        // 3. Fetch all requirements using the new many-to-many structure
        let requirements = [];
        if (domainId) {
            const [reqRows] = await pool.execute(
                `SELECT DISTINCT d.* 
                 FROM master_documentation d
                 JOIN master_documentation_mappings m ON d.id = m.doc_id
                 WHERE m.domain_id = ?
                   AND (m.category_id IS NULL OR m.category_id = ?)
                   AND (m.value_id IS NULL OR m.value_id = ?)`,
                [domainId, categoryId || null, valueId || null]
            );
            requirements = reqRows;
        }

        // 4. Fetch already uploaded documents for this lead
        const [uploadRows] = await pool.execute(
            'SELECT * FROM lead_documents WHERE lead_id = ?',
            [id]
        );

        res.json({
            requirements,
            uploads: uploadRows
        });
    } catch (err) {
        console.error("DocReq Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/leads/:id/documents/upload', authenticateToken, uploadDocuments.single('file'), async (req, res) => {
    const { id } = req.params;
    const { documentName, requirementId } = req.body;
    const uploadedBy = formatWho(req.user);

    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    try {
        const filePath = `uploads/documents/${req.file.filename}`;
        
        // We use an UPSERT style logic: if requirementId exists for this lead, update it.
        // If no requirementId (ad-hoc), we always insert.
        if (requirementId) {
            const [existing] = await pool.execute(
                'SELECT id FROM lead_documents WHERE lead_id = ? AND requirement_id = ?',
                [id, requirementId]
            );
            
            if (existing.length > 0) {
                await pool.execute(
                    `UPDATE lead_documents 
                     SET file_name = ?, file_path = ?, file_type = ?, status = 'Uploaded', 
                         uploaded_by = ?, uploaded_at = NOW() 
                     WHERE id = ?`,
                    [req.file.originalname, filePath, req.file.mimetype, uploadedBy, existing[0].id]
                );
                return res.json({ msg: "File updated successfully", filePath });
            }
        }

        await pool.execute(
            `INSERT INTO lead_documents 
            (lead_id, requirement_id, document_name, file_name, file_path, file_type, status, uploaded_by, uploaded_at) 
            VALUES (?, ?, ?, ?, ?, ?, 'Uploaded', ?, NOW())`,
            [id, requirementId || null, documentName, req.file.originalname, filePath, req.file.mimetype, uploadedBy]
        );
        res.json({ msg: "File uploaded successfully", filePath });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/leads/:id/documents/checklist', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { requirementId, documentName } = req.body;
    const uploadedBy = formatWho(req.user);

    if (!requirementId) return res.status(400).json({ msg: "Requirement ID is required for checklist" });

    try {
        const [existing] = await pool.execute(
            'SELECT id, status, file_path FROM lead_documents WHERE lead_id = ? AND requirement_id = ?',
            [id, requirementId]
        );

        if (existing.length > 0) {
            // Already there. If it's just 'Collected', we toggle it OFF (delete).
            // If it has a file, we don't allow unchecking via checklist logic (must delete file).
            if (existing[0].status === 'Collected') {
                await pool.execute('DELETE FROM lead_documents WHERE id = ?', [existing[0].id]);
                return res.json({ msg: "Document unchecked", action: 'removed' });
            } else {
                return res.json({ msg: "Document already uploaded", action: 'none' });
            }
        }

        // Not there, create a 'Collected' record
        await pool.execute(
            `INSERT INTO lead_documents 
            (lead_id, requirement_id, document_name, status, uploaded_by, uploaded_at) 
            VALUES (?, ?, ?, 'Collected', ?, NOW())`,
            [id, requirementId, documentName, uploadedBy]
        );
        res.json({ msg: "Document marked as Collected", action: 'added' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/leads/:id/documents/:docId/status', authenticateToken, async (req, res) => {
    const { docId } = req.params;
    const { status } = req.body;
    const identifier = formatWho(req.user);
    if (!['Pending', 'Uploaded', 'Verified', 'Rejected'].includes(status)) {
        return res.status(400).json({ msg: "Invalid status" });
    }
    try {
        await pool.execute(
            'UPDATE lead_documents SET status = ?, verified_by = ?, verified_at = CASE WHEN ? = "Verified" THEN NOW() ELSE verified_at END WHERE id = ?',
            [status, identifier, status, docId]
        );
        res.json({ msg: `Document status updated to ${status}` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/leads/:id/documents/:docId', authenticateToken, async (req, res) => {
    const { docId } = req.params;
    try {
        const [rows] = await pool.execute('SELECT file_path FROM lead_documents WHERE id = ?', [docId]);
        if (rows.length > 0 && rows[0].file_path) {
            const fullPath = path.join(__dirname, rows[0].file_path);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
        await pool.execute('DELETE FROM lead_documents WHERE id = ?', [docId]);
        res.json({ msg: "Document deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// EDIT LEAD (UPDATE)
app.put('/api/leads/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { student_name, email, phone, category, interested_in } = req.body;
    try {
        const [beforeRows] = await pool.query(
            'SELECT student_name, email, phone, category, interested_in FROM leads WHERE id = ?',
            [id]
        );
        if (beforeRows.length === 0) {
            return res.status(404).json({ message: "Lead not found" });
        }
        const before = beforeRows[0];
        const sql = `UPDATE leads SET student_name=?, email=?, phone=?, category=?, interested_in=? WHERE id=?`;
        const [result] = await pool.query(sql, [student_name, email, phone, category, interested_in, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Lead not found" });
        }
        const changedBy = req.user?.name || 'System';
        const historyRows = [];
        if ((before.student_name || '') !== (student_name || '')) historyRows.push([id, 'LEAD_EDIT', 'student_name', before.student_name || '', student_name || '', changedBy]);
        if ((before.email || '') !== (email || '')) historyRows.push([id, 'LEAD_EDIT', 'email', before.email || '', email || '', changedBy]);
        if ((before.phone || '') !== (phone || '')) historyRows.push([id, 'LEAD_EDIT', 'phone', before.phone || '', phone || '', changedBy]);
        if ((before.category || '') !== (category || '')) historyRows.push([id, 'LEAD_EDIT', 'category', before.category || '', category || '', changedBy]);
        if ((before.interested_in || '') !== (interested_in || '')) historyRows.push([id, 'LEAD_EDIT', 'interested_in', before.interested_in || '', interested_in || '', changedBy]);
        for (const h of historyRows) {
            await pool.query(
                `INSERT INTO lead_edit_history (lead_id, action_type, field_name, old_value, new_value, changed_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                h
            );
        }
        res.status(200).json({ message: "Lead updated successfully" });
    } catch (err) {
        console.error("DATABASE ERROR:", err);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
});

app.get('/api/dashboard/enquiry-trends', authenticateToken, async (req, res) => {
    const { range = 'week', domain: selectedDomain = 'All', startDate, endDate, date: specificDate, tzOffset } = req.query;
    const { userId: filterUserId } = req.query;
    const isSuperAdmin = isSuperAdminUser(req.user);
    const { domain: userDomain, id: loggedUserId } = req.user;

    try {
        const combinedBase = `
            (
                SELECT domain, status, created_at, assigned_to
                FROM leads
                WHERE is_active = 1
                UNION ALL
                SELECT service_type AS domain, 'New' AS status, created_at, NULL AS assigned_to
                FROM bgoi_enquiries e
                WHERE NOT EXISTS (
                    SELECT 1 FROM leads l 
                    WHERE l.source = 'Mobile App (Live)' AND l.student_name = e.candidate_name AND l.created_at = e.created_at
                )
            ) AS combined
        `;

        let where = " WHERE 1=1";
        const params = [];

        // 1. Staff/User Filter
        if (filterUserId && filterUserId !== 'All') {
            where += " AND assigned_to = ?";
            params.push(filterUserId);
        } else if (isStaffUser(req.user)) {
            where += " AND assigned_to = ?";
            params.push(loggedUserId);
        }

        // 2. Domain Filter (Security + Selection)
        if (!isSuperAdmin) {
            if (selectedDomain && selectedDomain !== 'All') {
                const authorized = String(userDomain || '').split(',').map(d => d.trim().toLowerCase());
                const effectiveDomain = authorized.includes(selectedDomain.toLowerCase().trim()) ? selectedDomain : userDomain;
                where = appendDomainCondition(where, params, effectiveDomain);
            } else {
                where = appendDomainCondition(where, params, userDomain);
            }
        } else if (selectedDomain && selectedDomain !== 'All') {
            where = appendDomainCondition(where, params, selectedDomain);
        }

        // 3. Timeframe Filter & Localization
        // Offset Calculation: DB is IST (+330 min). Local = IST + ((-tzOffset) - 330)
        const userTzOffset = parseInt(tzOffset || -330);
        const shiftMinutes = (-userTzOffset) - 330;

        let groupBy = "DATE(created_at)";
        let selectLabel = "DATE_FORMAT(created_at, '%Y-%m-%d')";

        if (range === 'day') {
            groupBy = `HOUR(DATE_ADD(created_at, INTERVAL ${shiftMinutes} MINUTE))`;
            selectLabel = `HOUR(DATE_ADD(created_at, INTERVAL ${shiftMinutes} MINUTE))`;
            if (specificDate) {
                where += " AND DATE(created_at) = ?";
                params.push(specificDate);
            } else {
                where += " AND DATE(created_at) = CURDATE()";
            }
        } else if (range === 'week') {
            where += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        } else if (range === 'month') {
            where += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
        } else if (range === 'year') {
            where += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";
        } else if (range === 'custom' && startDate && endDate) {
            where += " AND DATE(created_at) BETWEEN ? AND ?";
            params.push(startDate, endDate);
        }

        const sql = `
            SELECT 
                ${selectLabel} as label,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Follow Up' THEN 1 ELSE 0 END) as followup,
                SUM(CASE WHEN status = 'Enrolled' THEN 1 ELSE 0 END) as enrolled
            FROM ${combinedBase}
            ${where}
            GROUP BY ${groupBy}
            ORDER BY label ASC
        `;

        const [rawRows] = await pool.execute(sql, params);

        if (range === 'day') {
            const filled = [];
            for (let h = 0; h < 24; h++) {
                const found = rawRows.find(r => parseInt(r.label) === h);
                filled.push(found ? found : {
                    label: h,
                    enquiry: 0,
                    invalid: 0,
                    pending: 0,
                    followup: 0,
                    enrolled: 0,
                    total: 0
                });
            }
            return res.json(filled);
        }

        res.json(rawRows);
    } catch (err) {
        console.error("Enquiry Trends Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/dashboard/trends-daily', async (req, res) => {
    const { domain } = req.query;
    const isAll = domain === 'All';
    const getDailyData = (status) => {
        return new Promise((resolve, reject) => {
            // Get data for last 30 days
            let sql = `
                SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM leads 
                WHERE is_active = 1 AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                ${status ? 'AND status = ?' : ''}
                ${!isAll ? 'AND domain = ?' : ''}
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) ASC
            `;
            const params = [];
            if (status) params.push(status);
            if (!isAll) params.push(domain);
            pool.query(sql, params, (err, results) => {
                if (err) return reject(err);
                // Fill gaps for dates with 0 activity
                const last30Days = [];
                for (let i = 29; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const found = results.find(r => {
                        const dbDate = new Date(r.date).toISOString().split('T')[0];
                        return dbDate === dateStr;
                    });
                    last30Days.push({
                        date: dateStr,
                        value: found ? found.count : 0
                    });
                }
                resolve(last30Days);
            });
        });
    };
    try {
        const [enquiry, followup, admission] = await Promise.all([
            getDailyData('enquiry'),
            getDailyData('followup'),
            getDailyData('admission')
        ]);
        res.json({ enquiry, followup, admission });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NEW: GET Staff List for Dashboard Dropdown
// NEW: GET Staff List for Dashboard Dropdown
app.get('/api/dashboard/staff-list', authenticateToken, async (req, res) => {
    const { domain: selectedDomain } = req.query;
    const isSuperAdmin = isSuperAdminUser(req.user);
    const { domain: userDomain } = req.user;

    try {
        let sql = "SELECT id, name, domain, role, tier FROM users WHERE is_active = 1";
        const params = [];

        if (!isSuperAdmin) {
            // Non-super-admins see users within their authorized domains
            const authorized = getDomainAliases(userDomain);

            if (selectedDomain && selectedDomain !== 'All') {
                const requested = getDomainAliases(selectedDomain);
                const hasAccess = requested.every(r => authorized.includes(r));

                if (hasAccess) {
                    sql = appendDomainCondition(sql, params, selectedDomain);
                } else {
                    sql = appendDomainCondition(sql, params, userDomain);
                }
            } else {
                sql = appendDomainCondition(sql, params, userDomain);
            }
        } else if (selectedDomain && selectedDomain !== 'All') {
            sql = appendDomainCondition(sql, params, selectedDomain);
        }

        sql += " ORDER BY name ASC";
        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Staff List Error:", err);
        res.status(500).json({ error: err.message });
    }
});
// GET User Efficiency (Super Admin Only)
app.get('/api/admin/user-efficiency', authenticateToken, async (req, res) => {
    if (!isSuperAdminUser(req.user)) {
        return res.status(403).json({ msg: "Access denied. Super Admin only." });
    }

    try {
        const { userId, date, range = 'week', tzOffset } = req.query;
        const userTzOffset = parseInt(tzOffset || -330);
        const shiftMin = (-userTzOffset) - 330;

        // 1. Individual Hourly Breakdown (Used for "View Hourly" drill-down)
        if (userId && date) {
            const sql = `
                SELECT 
                    HOUR(DATE_ADD(CONCAT(activity_date, ' ', activity_hour, ':00:00'), INTERVAL ? MINUTE)) as hour, 
                    SUM(active_minutes) as minutes
                FROM user_activity_log
                WHERE user_id = ? AND activity_date = ?
                GROUP BY HOUR(DATE_ADD(CONCAT(activity_date, ' ', activity_hour, ':00:00'), INTERVAL ? MINUTE))
                ORDER BY hour ASC
            `;
            const [rows] = await pool.execute(sql, [shiftMin, userId, date, shiftMin]);

            const hourlyData = [];
            for (let i = 0; i < 24; i++) {
                const found = rows.find(r => r.hour === i);
                hourlyData.push({
                    hour: i,
                    label: `${i > 12 ? i - 12 : (i === 0 ? 12 : i)}:00 ${i >= 12 ? 'PM' : 'AM'}`,
                    minutes: found ? found.minutes : 0,
                    hours: found ? parseFloat((found.minutes / 60).toFixed(2)) : 0
                });
            }
            return res.json({ hourlyData });
        }
        const { startDate, endDate } = req.query;
        let sql = '';
        let params = [];

        if (range === 'day') {
            // Aggregation by Hour for a specific day
            const targetDate = date || new Date().toISOString().split('T')[0];
            sql = `
                SELECT 
                    u.name as userName,
                    HOUR(DATE_ADD(CONCAT(al.activity_date, ' ', al.activity_hour, ':00:00'), INTERVAL ? MINUTE)) as label,
                    SUM(al.active_minutes) as value
                FROM users u
                JOIN user_activity_log al ON u.id = al.user_id
                WHERE al.activity_date = ? AND u.is_active = 1
                ${userId ? 'AND u.id = ?' : ''}
                GROUP BY u.id, label
                ORDER BY label ASC
            `;
            params = userId ? [shiftMin, targetDate, userId] : [shiftMin, targetDate];
        } else if (range === 'week') {
            // Aggregation by Day for a specific range or last 7 days
            const whereClause = startDate && endDate
                ? `al.activity_date BETWEEN ? AND ?`
                : `al.activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;

            sql = `
                SELECT 
                    u.name as userName,
                    DATE_FORMAT(al.activity_date, '%Y-%m-%d') as label,
                    SUM(al.active_minutes) as value
                FROM users u
                JOIN user_activity_log al ON u.id = al.user_id
                WHERE ${whereClause} AND u.is_active = 1
                ${userId ? 'AND u.id = ?' : ''}
                GROUP BY u.id, al.activity_date
                ORDER BY al.activity_date ASC
            `;
            if (startDate && endDate) {
                params = userId ? [startDate, endDate, userId] : [startDate, endDate];
            } else if (userId) {
                params.push(userId);
            }
        } else {
            // Aggregation by Month for a specific range or last 12 months
            const whereClause = startDate && endDate
                ? `al.activity_date BETWEEN ? AND ?`
                : `al.activity_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)`;

            sql = `
                SELECT 
                    u.name as userName,
                    DATE_FORMAT(al.activity_date, '%Y-%m') as label,
                    SUM(al.active_minutes) as value
                FROM users u
                JOIN user_activity_log al ON u.id = al.user_id
                WHERE ${whereClause} AND u.is_active = 1
                ${userId ? 'AND u.id = ?' : ''}
                GROUP BY u.id, label
                ORDER BY label ASC
            `;
            if (startDate && endDate) {
                params = userId ? [startDate, endDate, userId] : [startDate, endDate];
            } else if (userId) {
                params.push(userId);
            }
        }

        const [chartRows] = await pool.execute(sql, params);
        const dataMap = {};
        if (range === 'day') {
            // Pre-fill all 24 hours (0 to 23)
            for (let i = 0; i < 24; i++) {
                dataMap[i] = { date: i };
            }
        }

        chartRows.forEach(row => {
            if (!dataMap[row.label]) {
                dataMap[row.label] = { date: row.label };
            }
            dataMap[row.label][row.userName] = parseFloat(Number(row.value).toFixed(2));
        });

        // Current Stats Summary logic
        let totalsSql = '';
        let totalParams = [];

        if (range === 'day' && (date || startDate)) {
            const targetDate = date || startDate || getISTDay();

            totalsSql = `
                SELECT u.id, u.name, IFNULL(SUM(al.active_minutes), 0) as totalMinutes, u.domain, 1 as activeDays, u.last_active_at, u.iactive,
                       TIMESTAMPDIFF(SECOND, u.last_active_at, NOW()) as secondsAgo
                FROM users u
                LEFT JOIN user_activity_log al ON u.id = al.user_id AND al.activity_date = ?
                WHERE u.is_active = 1
                ${userId ? 'AND u.id = ?' : ''}
                GROUP BY u.id
                ORDER BY IFNULL(SUM(al.active_minutes), 0) DESC
            `;
            totalParams = userId ? [targetDate, userId] : [targetDate];
        } else {
            const whereClause = startDate && endDate
                ? `al.activity_date BETWEEN ? AND ?`
                : `al.activity_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;

            const rangeDays = range === 'week' ? 7 : 30;

            totalsSql = `
                SELECT u.id, u.name, IFNULL(SUM(al.active_minutes), 0) as totalMinutes, u.domain, COUNT(DISTINCT al.activity_date) as activeDays, u.last_active_at, u.iactive,
                       TIMESTAMPDIFF(SECOND, u.last_active_at, NOW()) as secondsAgo
                FROM users u
                LEFT JOIN user_activity_log al ON u.id = al.user_id AND ${whereClause}
                WHERE u.is_active = 1
                ${userId ? 'AND u.id = ?' : ''}
                GROUP BY u.id
                ORDER BY IFNULL(SUM(al.active_minutes), 0) DESC
            `;

            if (startDate && endDate) {
                totalParams = userId ? [startDate, endDate, userId] : [startDate, endDate];
            } else {
                totalParams = userId ? [rangeDays, userId] : [rangeDays];
            }
        }

        const [totalsRows] = await pool.execute(totalsSql, totalParams);

        res.json({
            chartData: Object.values(dataMap),
            userTotals: totalsRows.map(u => ({
                id: u.id,
                name: u.name,
                domain: u.domain,
                last_active_at: u.last_active_at,
                iactive: u.iactive,
                secondsAgo: u.secondsAgo,
                totalMinutes: u.totalMinutes || 0,
                totalHours: parseFloat(((u.totalMinutes || 0) / 60).toFixed(2)),
                avgHours: parseFloat(((u.totalMinutes || 0) / 60 / (u.activeDays || 1)).toFixed(2))
            }))
        });
    } catch (err) {
        console.error("Efficiency API Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET Granular Efficiency Report (Super Admin Only)
app.get('/api/admin/efficiency-report', authenticateToken, async (req, res) => {
    if (!isSuperAdminUser(req.user)) {
        return res.status(403).json({ msg: "Access denied. Super Admin only." });
    }

    try {
        const { startDate, endDate, userId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "startDate and endDate are required" });
        }

        let sql = `
            SELECT 
                al.activity_date, 
                al.user_id, 
                u.name as userName, 
                u.employee_id,
                u.domain,
                al.activity_hour, 
                al.active_minutes
            FROM user_activity_log al
            JOIN users u ON al.user_id = u.id
            WHERE al.activity_date BETWEEN ? AND ?
            AND u.is_active = 1
        `;
        const params = [startDate, endDate];

        if (userId && userId !== 'All') {
            sql += ` AND al.user_id = ?`;
            params.push(userId);
        }

        sql += ` ORDER BY al.activity_date ASC, u.name ASC, al.activity_hour ASC`;

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Efficiency Report API Error:", err);
        res.status(500).json({ error: err.message });
    }
});


const startServer = async () => {
    try {
        await initDB();
        const PORT = 5005;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Bluestone CRM Backend active on port ${PORT}`);

            // 🕒 INACTIVITY SWEEPER: Every 60 seconds, mark users as inactive if no click/ping
            setInterval(async () => {
                try {
                    await pool.execute(`
                        UPDATE users 
                        SET iactive = 0 
                        WHERE iactive = 1 
                        AND last_active_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE)
                    `);
                } catch (err) {
                    console.error("[Sweeper Error]:", err.message);
                }
            }, 60000);
        });
    } catch (err) {
        console.error("Critical Startup Error:", err.message);
        process.exit(1);
    }
};

startServer();
