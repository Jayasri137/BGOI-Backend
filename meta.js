const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

// ================= CONFIG =================
const VERIFY_TOKEN = "mycrmverify123";
const ACCESS_TOKEN = "EAAWK9BscmAABRMpm8hGDZBqDZB0ZCMDwc1gBOP4XFjsZAETg6yoluIvMO8IKKA9NqqlZABWLo0Am89aR4V70BptkHPjCndgunB7gMusu4DkUgDOobLDBEe9ejBAseEstBiNCdnZAuw37FPHSwnJDcDKgysZCG7w6xWEgpZBbD81Dj3OFNhElfVnLC77meJZA0J2XphYYEZCqqwke5bqhNx7ZB8anUmuZBrUoGiTsYWXEv5D2ts6a9db1y3X5aKuiPbI8DwiodRM2EoLv3Ei9EcFmZCQNk9YVP";

// ================= DATABASE =================
const pool = mysql.createPool({
    host: 'auth-db1278.hstgr.io',
    user: 'u287260207_bgoi_user',
    password: '4g@LMW2026',
    database: 'u287260207_bgoi_bg',
    connectTimeout: 15000,
    waitForConnections: true,
    connectionLimit: 10
});

// ================= STEP 1: VERIFY WEBHOOK =================
app.get('/meta-webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("Meta webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ================= STEP 2: RECEIVE LEAD =================
app.post('/meta-webhook', async (req, res) => {
  try {
    const change = req.body.entry?.[0]?.changes?.[0];
    const leadgen_id = change?.value?.leadgen_id;

    if (!leadgen_id) {
      return res.sendStatus(200);
    }

    // ================= STEP 3: GET FULL LEAD DATA =================
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${leadgen_id}`,
      {
        params: {
          access_token: ACCESS_TOKEN
        }
      }
    );

    const fieldData = response.data.field_data;

    let lead = {};
    fieldData.forEach(field => {
      lead[field.name] = field.values[0];
    });

    const finalLead = {
      name: lead.full_name || '',
      email: lead.email || '',
      phone: lead.phone_number || '',
      source: 'facebook_ads'
    };

    const query = `
      INSERT INTO leads (student_name, email, phone, source, domain, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [
      finalLead.name,
      finalLead.email,
      finalLead.phone,
      finalLead.source,
      'Facebook Ads', // Default domain for now
      'New'
    ]);

    console.log("Lead Saved:", finalLead);

    res.sendStatus(200);

  } catch (error) {
    console.error("Error:", error.message);
    res.sendStatus(500);
  }
});

// ================= START SERVER =================
app.listen(3000, () => {
  console.log("Server running on port 3000");
});