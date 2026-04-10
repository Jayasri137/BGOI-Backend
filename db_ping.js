const net = require('net');

const host = 'auth-db1278.hstgr.io';
const port = 3306;
const timeout = 10000;

console.log(`--- TCP Port Connectivity Test ---`);
console.log(`Checking if ${host}:${port} is reachable...`);

const socket = new net.Socket();
const startTime = Date.now();

socket.setTimeout(timeout);

socket.on('connect', () => {
    const duration = Date.now() - startTime;
    console.log(`✅ SUCCESS: Port ${port} is open and reachable!`);
    console.log(`Latency: ${duration}ms`);
    socket.destroy();
    process.exit(0);
});

socket.on('timeout', () => {
    console.error(`❌ TIMEOUT: Could not reach ${host}:${port} within ${timeout}ms.`);
    console.log(`Possible causes: Server is down, firewall blocking port 3306, or bad internet.`);
    socket.destroy();
    process.exit(1);
});

socket.on('error', (err) => {
    console.error(`❌ ERROR: Failed to connect to ${host}:${port}`);
    console.error(`Reason: ${err.message}`);
    socket.destroy();
    process.exit(1);
});

socket.connect(port, host);
