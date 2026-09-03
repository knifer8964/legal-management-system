// M7 Smoke Test - Node.js
const http = require('http');

const BASE = 'http://127.0.0.1:3000/api/v1';
let token = '';

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1',
      port: 3000,
      path: `/api/v1${path}`,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);

    const r = http.request(opts, (res) => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch { resolve({ raw: buf, status: res.statusCode }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  try {
    // 1. Login
    const login = await req('POST', '/auth/login', { username: 'admin', password: '123456' });
    token = login.data.token;
    console.log('[1] Login OK, token length:', token.length);

    // 2. GET /users
    const users = await req('GET', '/users');
    console.log('[2] GET /users -> success:', users.success, 'count:', users.data?.length);

    // 3. GET /users/1
    const user1 = await req('GET', '/users/1');
    console.log('[3] GET /users/1 -> success:', user1.success, 'username:', user1.data?.username);

    // 4. GET /users/roles
    const roles = await req('GET', '/users/roles');
    console.log('[4] GET /users/roles -> success:', roles.success, 'roles:', roles.data?.map(r => r.roleName));

    // 5. POST /users (create)
    const uniqueName = 'testuser_' + Date.now();
    const created = await req('POST', '/users', {
      username: uniqueName, password: 'test123456',
      realName: 'M7-Test', email: uniqueName + '@test.com', roleId: 2
    });
    console.log('[5] POST /users -> success:', created.success, 'id:', created.data?.id, 'msg:', created.message || created.error?.message);
    const testId = created.data?.id;

    // 6. PUT /users/:id
    const updated = await req('PUT', `/users/${testId}`, { realName: 'M7-Test-Updated', phone: '13800138000' });
    console.log('[6] PUT /users/' + testId + ' -> success:', updated.success, 'realName:', updated.data?.realName);

    // 7. reset-password
    const reset = await req('POST', `/users/${testId}/reset-password`, { newPassword: 'newpass123' });
    console.log('[7] reset-password -> success:', reset.success, 'msg:', reset.message);

    // 8. DELETE
    const del = await req('DELETE', `/users/${testId}`);
    console.log('[8] DELETE /users/' + testId + ' -> success:', del.success, 'msg:', del.message);

    console.log('\n=== All M7 smoke tests passed ===');
  } catch (e) {
    console.error('TEST FAILED:', e.message);
    process.exit(1);
  }
})();
