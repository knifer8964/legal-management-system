const http = require('http');

const BASE = '127.0.0.1';
const PORT = 3000;
const PREFIX = '/api/v1';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: BASE,
      port: PORT,
      path: PREFIX + path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(chunks) });
        } catch {
          resolve({ status: res.statusCode, body: chunks });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  let passed = 0;
  let failed = 0;

  function check(name, status, ok) {
    if (ok) {
      passed++;
      console.log(`✅ ${name} (${status})`);
    } else {
      failed++;
      console.log(`❌ ${name} (${status})`);
    }
  }

  // Login
  const login = await request('POST', '/auth/login', { username: 'admin', password: '123456' });
  check('POST /auth/login', login.status, login.status === 200 && login.body.success);
  const token = login.body.data.token;

  // Clients
  const clients = await request('GET', '/clients?page=1&pageSize=5', null, token);
  check('GET /clients', clients.status, clients.status === 200 && Array.isArray(clients.body.data.data));

  // Matters
  const matters = await request('GET', '/matters?page=1&pageSize=5', null, token);
  check('GET /matters', matters.status, matters.status === 200 && Array.isArray(matters.body.data.data));

  // Tasks
  const tasks = await request('GET', '/tasks?page=1&pageSize=5', null, token);
  check('GET /tasks', tasks.status, tasks.status === 200 && Array.isArray(tasks.body.data.data));

  // Communications
  const comms = await request('GET', '/communications?page=1&pageSize=5', null, token);
  check('GET /communications', comms.status, comms.status === 200 && Array.isArray(comms.body.data.data));

  // Time entries
  const entries = await request('GET', '/time-entries?page=1&pageSize=5', null, token);
  check('GET /time-entries', entries.status, entries.status === 200 && Array.isArray(entries.body.data.data));

  // Health
  const health = await new Promise((resolve, reject) => {
    const req = http.request({ hostname: BASE, port: PORT, path: '/health', method: 'GET' }, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
  check('GET /health', health.status, health.status === 200);

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
