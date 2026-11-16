// appRoutes.js - Complete Dual-Database Module for BOC Mobile & Web App (IDP Architecture)
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = function (crmPool, JWT_SECRET, getNextLeadCode, getISTString, triggerEmails) {
    const router = express.Router();

    // ==========================================
    // 1. OVERSEAS STUDENT DATABASE POOL
    // (Shared with Bluestone Overseas Website & BOC Mobile App)
    // ==========================================
    const overseasPool = mysql.createPool({
        host: 'srv696.hstgr.io',
        user: 'u287260207_new_user',
        password: 'nwUser@>26',
        database: 'u287260207_overseas_newdb',
        connectTimeout: 30000,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 50,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        timezone: '+05:30'
    });

    // Auto-verify and create student users table in overseas_newdb
    const initOverseasTables = async () => {
        try {
            await overseasPool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    phone VARCHAR(50),
                    password VARCHAR(255) NOT NULL,
                    target_country VARCHAR(100) DEFAULT 'United Kingdom',
                    preferred_degree VARCHAR(100) DEFAULT 'Postgraduate',
                    target_intake VARCHAR(100) DEFAULT 'Fall 2026',
                    avatar_url VARCHAR(500) DEFAULT NULL,
                    is_active TINYINT DEFAULT 1,
                    created_at DATETIME,
                    updated_at DATETIME
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            console.log("✅ [BOC Module] Student users table verified in overseas_newdb");
        } catch (err) {
            console.error("❌ [BOC Module] Error creating tables in overseas_newdb:", err.message);
        }
    };
    initOverseasTables().catch(() => {});

    // Student Auth Middleware
    const authenticateStudent = (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, error: "Access token required" });

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ success: false, error: "Invalid or expired token" });
            req.user = user;
            next();
        });
    };

    // ==========================================
    // 2. STUDENT REGISTRATION (Saved in Overseas DB)
    // ==========================================
    router.post('/auth/register', async (req, res) => {
        try {
            const { name, email, phone, password, target_country, preferred_degree, target_intake } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ success: false, error: "Name, email, and password are required" });
            }

            // Check if email already registered in overseas DB
            const [existing] = await overseasPool.execute('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, error: "An account with this email already exists. Please sign in." });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const nowStr = getISTString();

            // Insert into Overseas Student Database
            const [result] = await overseasPool.execute(
                `INSERT INTO users 
                 (name, email, phone, password, target_country, preferred_degree, target_intake, is_active, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
                [
                    name,
                    email,
                    phone || null,
                    hashedPassword,
                    target_country || 'United Kingdom',
                    preferred_degree || 'Postgraduate',
                    target_intake || 'Fall 2026',
                    nowStr,
                    nowStr
                ]
            );

            const userId = result.insertId;
            const token = jwt.sign(
                { id: userId, name, email, user_type: 'BOC_STUDENT' },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.status(201).json({
                success: true,
                message: "Account created successfully",
                token,
                user: {
                    id: userId,
                    name,
                    email,
                    phone,
                    target_country: target_country || 'United Kingdom',
                    preferred_degree: preferred_degree || 'Postgraduate',
                    target_intake: target_intake || 'Fall 2026'
                }
            });
        } catch (err) {
            console.error("BOC Register Error:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ==========================================
    // 3. STUDENT LOGIN (Authenticated from Overseas DB)
    // ==========================================
    router.post('/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, error: "Email and password are required" });
            }

            const [rows] = await overseasPool.execute(
                'SELECT * FROM users WHERE email = ? AND is_active = 1',
                [email]
            );

            if (rows.length === 0) {
                return res.status(400).json({ success: false, error: "Account not found. Please create an account first." });
            }

            const user = rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, error: "Incorrect password. Please try again." });
            }

            const token = jwt.sign(
                { id: user.id, name: user.name, email: user.email, user_type: 'BOC_STUDENT' },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    target_country: user.target_country,
                    preferred_degree: user.preferred_degree,
                    target_intake: user.target_intake
                }
            });
        } catch (err) {
            console.error("BOC Login Error:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ==========================================
    // 4. 1-ON-1 COUNSELLOR CONSULTATION (Action Intent -> Injects into CRM `leads`)
    // ==========================================
    router.post('/counsellor/book', async (req, res) => {
        try {
            const { name, email, phone, target_country, intake, slot_time, mode, counsellor_name, notes, user_id } = req.body;
            if (!name || !phone) {
                return res.status(400).json({ success: false, error: "Name and phone are required" });
            }

            const domain = 'Bluestone Overseas';
            const leadCode = await getNextLeadCode(domain);
            const nowStr = getISTString();
            const remarkText = `[BOC Mobile App] Mode: ${mode || 'Video Call'} | Slot: ${slot_time || 'N/A'} | Counsellor: ${counsellor_name || 'Any'} | Notes: ${notes || '-'}`;

            // Injects directly into CRM central leads table
            await crmPool.execute(
                `INSERT INTO leads 
                (student_name, email, phone, domain, category, source, interested_in, remarks, lead_code, status, is_active, payment_status, intake, app_user_id, created_at)
                VALUES (?, ?, ?, ?, 'Free Consultation', 'BOC Mobile App', ?, ?, ?, 'New', 1, 'Pending payment', ?, ?, ?)`,
                [
                    name,
                    email || null,
                    phone,
                    domain,
                    target_country || 'Overseas Education',
                    remarkText,
                    leadCode,
                    intake || null,
                    user_id || null,
                    nowStr
                ]
            );

            if (email) {
                triggerEmails(name, email, phone, remarkText, domain, target_country || 'Free Consultation', 'BOC Mobile App');
            }

            res.status(201).json({
                success: true,
                message: "Consultation booked successfully",
                lead_code: leadCode,
                slot: slot_time
            });
        } catch (err) {
            console.error("BOC Counsellor Booking Error:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ==========================================
    // 5. LIVE APPLICATION STATUS TRACKER (Reads from CRM `leads`)
    // ==========================================
    router.get('/applications/my-status', authenticateStudent, async (req, res) => {
        try {
            const userEmail = req.user.email;
            const userId = req.user.id;

            const [leads] = await crmPool.execute(
                `SELECT id, lead_code, student_name, university_name, course_name, intake,
                        overseas_pipeline_status, primary_status, secondary_status, status, created_at, updated_at
                 FROM leads
                 WHERE (email = ? OR app_user_id = ?) AND is_active = 1
                 ORDER BY created_at DESC`,
                [userEmail, userId]
            );

            res.json({
                success: true,
                data: leads.map(l => ({
                    id: l.id,
                    lead_code: l.lead_code,
                    university: l.university_name || 'University of Manchester',
                    course: l.course_name || 'MSc Data Science',
                    intake: l.intake || 'Fall 2026',
                    stage: l.overseas_pipeline_status || 'Document Collection',
                    status: l.status
                }))
            });
        } catch (err) {
            console.error("BOC Application Status Error:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ==========================================
    // 6. IDP STUDENT COMMUNITY FEED
    // ==========================================
    router.get('/community/feed', async (req, res) => {
        try {
            const posts = [
                {
                    id: 1,
                    author: "Rohan V.",
                    country_badge: "🇬🇧 UK",
                    destination: "University of Warwick",
                    title: "Got CAS Letter for Sept 2026 intake!",
                    content: "Applied through Bluestone Overseas in Nov, received CAS today. If anyone has questions regarding GTE or TB test, ask below!",
                    likes: 42,
                    comments_count: 14,
                    created_at: "2 hours ago"
                },
                {
                    id: 2,
                    author: "Sneha Patel",
                    country_badge: "🇦🇺 Australia",
                    destination: "University of Melbourne",
                    title: "Subclass 500 Visa Approved in 9 Days!",
                    content: "Sharing my timeline: Medical done on 12th Jan, Biometrics on 14th, Grant on 23rd Jan. Thanks to Priya mam for SOP review.",
                    likes: 68,
                    comments_count: 29,
                    created_at: "5 hours ago"
                },
                {
                    id: 3,
                    author: "Amit Sharma",
                    country_badge: "🇩🇪 Germany",
                    destination: "TU Munich",
                    title: "APS Certificate Timeline Update (Winter 2026)",
                    content: "APS verification took exactly 3.5 weeks from document delivery. Make sure all transcripts are notarized.",
                    likes: 31,
                    comments_count: 8,
                    created_at: "1 day ago"
                }
            ];

            res.json({ success: true, data: posts });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
};
