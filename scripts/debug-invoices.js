const BASE = 'http://127.0.0.1:3000/api/v1';
async function main() {
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const res = await fetch(`${BASE}/invoices?page=1&pageSize=10`, { headers });
  const json = await res.json();
  console.log('status:', res.status);
  console.log('code:', json.code);
  console.log('message:', json.message);
  console.log('data type:', typeof json.data);
  console.log('data keys:', json.data ? Object.keys(json.data) : 'null');
  console.log('data.data:', json.data?.data);
  console.log('data.pagination:', json.data?.pagination);
  console.log('full:', JSON.stringify(json, null, 2));
}
main();
