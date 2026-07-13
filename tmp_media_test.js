const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const filePath = path.join(process.cwd(), 'tmp_test_image.jpg');
fs.writeFileSync(filePath, Buffer.from('fake-image-data'));
const token = jwt.sign({ id: 1, name: 'Test', role: 'Admin', tier: 'ADMIN', can_edit: 1 }, 'bg_secret_2026');
const boundary = crypto.randomBytes(16).toString('hex');
const payload = [];
function addField(name, value) {
  payload.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
}
function addFile(name, filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  payload.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${path.basename(filePath)}"\r\nContent-Type: image/jpeg\r\n\r\n`));
  payload.push(fileBuffer);
  payload.push(Buffer.from('\r\n'));
}
addField('domain', 'Test');
addField('category', 'image');
addField('period', '2024-2025');
addField('title', 'Test');
addFile('file', filePath);
payload.push(Buffer.from(`--${boundary}--\r\n`));
const body = Buffer.concat(payload);
const req = http.request({
  hostname: '127.0.0.1',
  port: 5005,
  path: '/api/media',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  }
}, (res) => {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('status', res.statusCode);
    console.log(data);
    fs.unlinkSync(filePath);
  });
});
req.on('error', err => {
  console.error(err);
  fs.unlinkSync(filePath);
});
req.write(body);
req.end();
