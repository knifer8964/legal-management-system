// M9 文档管理模块冒烟测试
// 覆盖接口: 列表 / 创建元数据 / 详情 / 更新 / 删除 / 统计
// 运行前提: 后端已启动于 http://127.0.0.1:3000
// 运行方式: node scripts/m9-smoke-test.js
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
  let documentId;

  // 2. 检查是否有客户数据，没有就创建一个（文档可关联 clientId）
  const clientsRes = await fetch(`${BASE}/clients?page=1&pageSize=1`, { headers });
  const clientsData = await clientsRes.json();
  let clientId = clientsData.data?.data?.[0]?.id || clientsData.data?.[0]?.id;

  if (!clientId) {
    console.log('  — 数据库无客户数据，先创建测试客户...');
    const createClientRes = await fetch(`${BASE}/clients`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'M9测试客户',
        clientType: 'PERSONAL',
        phone: '13800000002',
        email: 'm9test@test.com'
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

  // 3. GET /documents 列表
  try {
    const res = await fetch(`${BASE}/documents?page=1&pageSize=10`, { headers });
    const json = await res.json();
    if (res.status === 200 && json.success === true) {
      const list = json.data?.data || json.data || [];
      const pagination = json.data?.pagination || json.pagination;
      console.log(`[PASS] GET /documents 列表 — 返回 ${Array.isArray(list) ? list.length : 'N/A'} 条` +
        (pagination ? `, total=${pagination.total}` : ''));
    } else {
      console.log(`[FAIL] GET /documents 列表 — status=${res.status}, body=${JSON.stringify(json)}`);
      failed++;
    }
  } catch (e) { console.log('[FAIL] GET /documents 列表 —', e.message); failed++; }
  passed++;

  // 4. POST /documents 创建文档元数据
  try {
    const res = await fetch(`${BASE}/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fileName: 'm9-test-20260903.pdf',
        originalName: '测试合同.pdf',
        filePath: '/uploads/documents/m9-test-20260903.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        clientId,
        category: 'CONTRACT',
        tags: ['测试', '冒烟'],
        description: 'M9冒烟测试文档'
      })
    });
    const json = await res.json();
    documentId = json.data?.id;
    if ((res.status === 200 || res.status === 201) && documentId) {
      console.log(`[PASS] POST /documents 创建 — id=${documentId}, fileName=${json.data.fileName}`);
    } else {
      console.log(`[FAIL] POST /documents 创建 — status=${res.status}, body=${JSON.stringify(json)}`);
      failed++;
    }
  } catch (e) { console.log('[FAIL] POST /documents 创建 —', e.message); failed++; }
  passed++;

  // 5. GET /documents/:id 详情
  if (documentId) {
    try {
      const res = await fetch(`${BASE}/documents/${documentId}`, { headers });
      const json = await res.json();
      if (res.status === 200 && json.success === true && json.data) {
        console.log(`[PASS] GET /documents/:id 详情 — fileName=${json.data.fileName}`);
      } else {
        console.log(`[FAIL] GET /documents/:id 详情 — status=${res.status}, body=${JSON.stringify(json)}`);
        failed++;
      }
    } catch (e) { console.log('[FAIL] GET /documents/:id 详情 —', e.message); failed++; }
  } else { console.log('[SKIP] GET /documents/:id 详情 — 无 documentId'); failed++; }
  passed++;

  // 6. PUT /documents/:id 更新
  if (documentId) {
    try {
      const res = await fetch(`${BASE}/documents/${documentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ description: 'M9更新测试', category: 'EVIDENCE' })
      });
      const json = await res.json();
      if (res.status === 200 && json.success === true && json.data) {
        console.log(`[PASS] PUT /documents/:id 更新 — category=${json.data.category}, description=${json.data.description}`);
      } else {
        console.log(`[FAIL] PUT /documents/:id 更新 — status=${res.status}, body=${JSON.stringify(json)}`);
        failed++;
      }
    } catch (e) { console.log('[FAIL] PUT /documents/:id 更新 —', e.message); failed++; }
  } else { console.log('[SKIP] PUT /documents/:id 更新 — 无 documentId'); failed++; }
  passed++;

  // 7. GET /documents/stats 统计
  try {
    const res = await fetch(`${BASE}/documents/stats`, { headers });
    const json = await res.json();
    if (res.status === 200 && json.success === true && json.data) {
      const keys = Object.keys(json.data).slice(0, 6).join(',');
      console.log(`[PASS] GET /documents/stats 统计 — 字段: ${keys}`);
    } else {
      console.log(`[FAIL] GET /documents/stats 统计 — status=${res.status}, body=${JSON.stringify(json)}`);
      failed++;
    }
  } catch (e) { console.log('[FAIL] GET /documents/stats 统计 —', e.message); failed++; }
  passed++;

  // 8. DELETE /documents/:id 删除
  if (documentId) {
    try {
      const res = await fetch(`${BASE}/documents/${documentId}`, { method: 'DELETE', headers });
      const json = await res.json();
      if (res.status === 200) {
        console.log(`[PASS] DELETE /documents/:id 删除 — ${json.message || 'OK'}`);
      } else {
        console.log(`[FAIL] DELETE /documents/:id 删除 — status=${res.status}, body=${JSON.stringify(json)}`);
        failed++;
      }
    } catch (e) { console.log('[FAIL] DELETE /documents/:id 删除 —', e.message); failed++; }
  } else { console.log('[SKIP] DELETE /documents/:id 删除 — 无 documentId'); failed++; }
  passed++;

  // 汇总
  console.log(`\n=== M9 文档管理模块冒烟测试汇总 ===`);
  console.log(`通过: ${passed - failed} / ${passed}, 失败: ${failed}`);
  if (failed > 0) {
    console.log('\n❌ 有失败项，请检查（若 /documents 路由尚未注册，列表/创建会报 404，属预期）');
    process.exit(1);
  } else {
    console.log('\n✅ 全部通过！');
  }
}

main().catch(e => { console.error('测试执行异常:', e); process.exit(1); });
