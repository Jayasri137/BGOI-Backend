const fetch = require('node-fetch');

async function test() {
    const API_BASE = 'http://localhost:5005/api';
    // Note: You might need a valid token here if the server enforces it.
    // Assuming the user is running the server and I can use their token if I had it.
    // For now, I'll just check if the route exists and returns 401/403 or data.
    try {
        const res = await fetch(`${API_BASE}/master/agent-companies`);
        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Data:', data);
        } else {
            console.log('Error:', await res.text());
        }
    } catch (err) {
        console.error('Fetch failed:', err.message);
    }
}

test();
