// Debug login response
const http = require('http');
const data = JSON.stringify({ username: 'admin', password: '123456' });
const r = http.request({
  hostname: '127.0.0.1', port: 3000, path: '/api/v1/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    const j = JSON.parse(b);
    console.log('Full response:', JSON.stringify(j, null, 2));
    console.log('Token:', j.data?.token);
    console.log('User:', JSON.stringify(j.data?.user));
    console.log('Permissions:', j.data?.user?.permissions);
  });
});
r.write(data);
r.end();
