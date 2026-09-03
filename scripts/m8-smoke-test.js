// M8 冒烟测试修复版 — 先确保有客户数据再测发票
const BASE = 'http://127.0.0.1:3000/api/v1';

async function main() {
  // 1. 登录
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) { console.log('[FAIL] 登录失败'); process.exit(1); }
  console.log(`[PASS] 登录 POST /auth/login — token 长度 ${token.length}`);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  let passed = 1, failed = 0;
  let invoiceId;

  // 2. 检查是否有客户数据，没有就创建一个
  const clientsRes = await fetch(`${BASE}/clients?page=1&pageSize=1`, { headers });
  const clientsData = await clientsRes.json();
  let clientId = clientsData.data?.data?.[0]?.id || clientsData.data?.[0]?.id;

  if (!clientId) {
    console.log('  — 数据库无客户数据，先创建测试客户...');
    const createClientRes = await fetch(`${BASE}/clients`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'M8测试客户',
        clientType: 'PERSONAL',
        phone: '13800000001',
        email: 'm8test@test.com'
      })
    });
    const createClientData = await createClientRes.json();
    clientId = createClientData.data?.id;
    if (!clientId) {
      console.log('[FAIL] 创建测试客户失败:', JSON.stringify(createClientData));
      process.exit(1);
    }
    console.log(`  — 测试客户创建成功, id=${clientId}`);
  } else {
    console.log(`  — 已有客户数据, clientId=${clientId}`);
  }

  // 3. GET /invoices 列表
  try {
    const res = await fetch(`${BASE}/invoices?page=1&pageSize=10`, { headers });
    const json = await res.json();
    if (res.status === 200 && (json.code === 200 || json.success === true)) {
      const list = json.data?.data || json.data || [];
      console.log(`[PASS] GET /invoices 列表 — 返回 ${Array.isArray(list) ? list.length : 'N/A'} 条`);
    } else {
      console.log(`[FAIL] GET /invoices 列表 — status=${res.status}`);
      failed++;
    }
  } catch (e) { console.log('[FAIL] GET /invoices 列表 —', e.message); failed++; }
  passed++;

  // 4. POST /invoices 创建
  try {
    const res = await fetch(`${BASE}/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clientId,
        subtotal: 10000,
        taxRate: 6,
        discount: 0,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        notes: 'M8冒烟测试发票'
      })
    });
    const json = await res.json();
    invoiceId = json.data?.id;
    if (res.status === 201 && invoiceId) {
      console.log(`[PASS] POST /invoices 创建 — id=${invoiceId}, invoiceNo=${json.data.invoiceNo}`);
    } else {
      console.log(`[FAIL] POST /invoices 创建 — status=${res.status}, body=${JSON.stringify(json)}`);
      failed++;
    }
  } catch (e) { console.log('[FAIL] POST /invoices 创建 —', e.message); failed++; }
  passed++;

  // 5. GET /invoices/:id 详情
  if (invoiceId) {
    try {
      const res = await fetch(`${BASE}/invoices/${invoiceId}`, { headers });
      const json = await res.json();
      if (res.status === 200 && json.data) {
        console.log(`[PASS] GET /invoices/:id 详情 — invoiceNo=${json.data.invoiceNo}`);
      } else {
        console.log(`[FAIL] GET /invoices/:id 详情 — status=${res.status}`);
        failed++;
      }
    } catch (e) { console.log('[FAIL] GET /invoices/:id 详情 —', e.message); failed++; }
  } else { console.log('[SKIP] GET /invoices/:id 详情 — 无 invoiceId'); failed++; }
  passed++;

  // 6. PUT /invoices/:id 更新
  if (invoiceId) {
    try {
      const res = await fetch(`${BASE}/invoices/${invoiceId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ notes: 'M8更新测试', status: 'ISSUED' })
      });
      const json = await res.json();
      if (res.status === 200 && json.data) {
        console.log(`[PASS] PUT /invoices/:id 更新 — status=${json.data.status}`);
      } else {
        console.log(`[FAIL] PUT /invoices/:id 更新 — status=${res.status}`);
        failed++;
      }
    } catch (e) { console.log('[FAIL] PUT /invoices/:id 更新 —', e.message); failed++; }
  } else { console.log('[SKIP] PUT /invoices/:id 更新 — 无 invoiceId'); failed++; }
  passed++;

  // 7. GET /invoices/stats 统计
  try {
    const res = await fetch(`${BASE}/invoices/stats`, { headers });
    const json = await res.json();
    if (res.status === 200 && json.data) {
      console.log(`[PASS] GET /invoices/stats 统计 — totalInvoices=${json.data.totalInvoices}`);
    } else {
      console.log(`[FAIL] GET /invoices/stats 统计 — status=${res.status}`);
      failed++;
    }
  } catch (e) { console.log('[FAIL] GET /invoices/stats 统计 —', e.message); failed++; }
  passed++;

  // 8. POST /invoices/:id/payment 支付
  if (invoiceId) {
    try {
      const res = await fetch(`${BASE}/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount: 5000 })
      });
      const json = await res.json();
      if (res.status === 200 && json.data) {
        console.log(`[PASS] POST /invoices/:id/payment 支付 — paidAmount=${json.data.paidAmount}, status=${json.data.status}`);
      } else {
        console.log(`[FAIL] POST /invoices/:id/payment — status=${res.status}`);
        failed++;
      }
    } catch (e) { console.log('[FAIL] POST /invoices/:id/payment —', e.message); failed++; }
  } else { console.log('[SKIP] POST /invoices/:id/payment — 无 invoiceId'); failed++; }
  passed++;

  // 9. DELETE /invoices/:id 删除
  if (invoiceId) {
    try {
      const res = await fetch(`${BASE}/invoices/${invoiceId}`, { method: 'DELETE', headers });
      const json = await res.json();
      if (res.status === 200) {
        console.log(`[PASS] DELETE /invoices/:id 删除 — ${json.message}`);
      } else {
        console.log(`[FAIL] DELETE /invoices/:id 删除 — status=${res.status}`);
        failed++;
      }
    } catch (e) { console.log('[FAIL] DELETE /invoices/:id 删除 —', e.message); failed++; }
  } else { console.log('[SKIP] DELETE /invoices/:id 删除 — 无 invoiceId'); failed++; }
  passed++;

  // 汇总
  console.log(`\n=== M8 发票模块冒烟测试汇总 ===`);
  console.log(`通过: ${passed - failed} / ${passed}, 失败: ${failed}`);
  if (failed > 0) {
    console.log('\n❌ 有失败项，请检查');
    process.exit(1);
  } else {
    console.log('\n✅ 全部通过！');
  }
}

main().catch(e => { console.error('测试执行异常:', e); process.exit(1); });
