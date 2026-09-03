// M7/M8/M9 全量回归测试 — 覆盖 Happy Path + Edge Cases + Error Cases + Auth
// 运行前提: 后端已启动于 http://127.0.0.1:3000
// 运行方式: node scripts/full-regression-test.js
const BASE = 'http://127.0.0.1:3000/api/v1';

let passed = 0, failed = 0, skipped = 0;
const results = [];

function record(name, status, detail = '') {
  const tag = status === 'PASS' ? '[PASS]' : status === 'FAIL' ? '[FAIL]' : '[SKIP]';
  console.log(`${tag} ${name}${detail ? ' — ' + detail : ''}`);
  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
  else skipped++;
  results.push({ name, status, detail });
}

async function api(method, path, body, headers) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  M7/M8/M9 全量回归测试');
  console.log('═══════════════════════════════════════════\n');

  // ========== 认证 ==========
  console.log('── 认证 ──');
  const loginRes = await api('POST', '/auth/login', { username: 'admin', password: '123456' });
  const token = loginRes.json?.data?.token;
  if (token) record('登录 admin', 'PASS', `token len=${token.length}`);
  else { record('登录 admin', 'FAIL', JSON.stringify(loginRes.json)); process.exit(1); }

  const authHeaders = { 'Authorization': `Bearer ${token}` };
  const noAuth = {};

  // ========== M7: 用户管理与权限 ==========
  console.log('\n── M7: 用户管理 ──');

  // Happy Path
  const userList = await api('GET', '/users?page=1&pageSize=10', null, authHeaders);
  if (userList.status === 200 && userList.json?.success) record('GET /users 列表', 'PASS', `count=${userList.json.data?.data?.length ?? userList.json.data?.length}`);
  else record('GET /users 列表', 'FAIL', JSON.stringify(userList.json));

  const rolesList = await api('GET', '/users/roles', null, authHeaders);
  if (rolesList.status === 200 && rolesList.json?.success) record('GET /users/roles', 'PASS', `roles=${rolesList.json.data?.length}`);
  else record('GET /users/roles', 'FAIL', `status=${rolesList.status}`);

  const userById = await api('GET', '/users/1', null, authHeaders);
  if (userById.status === 200 && userById.json?.success) record('GET /users/1 详情', 'PASS', `name=${userById.json.data?.name ?? userById.json.data?.username}`);
  else record('GET /users/1 详情', 'FAIL', JSON.stringify(userById.json));

  // Edge: 不存在的用户
  const userNotFound = await api('GET', '/users/99999', null, authHeaders);
  if (userNotFound.status === 404 || (userNotFound.json?.success === false)) record('GET /users/99999 不存在', 'PASS', `status=${userNotFound.status}`);
  else record('GET /users/99999 不存在', 'FAIL', `应返回404但返回${userNotFound.status}`);

  // Edge: 无效分页参数
  const userBadPage = await api('GET', '/users?page=0&pageSize=0', null, authHeaders);
  if (userBadPage.status === 200 || userBadPage.status === 400) record('GET /users page=0 边界', 'PASS', `status=${userBadPage.status}`);
  else record('GET /users page=0 边界', 'FAIL', `status=${userBadPage.status}`);

  // Auth: 无 token
  const userNoAuth = await api('GET', '/users', null, noAuth);
  if (userNoAuth.status === 401) record('GET /users 无token', 'PASS', '正确拒绝 401');
  else record('GET /users 无token', 'FAIL', `应401但返回${userNoAuth.status}`);

  // ========== M8: 发票管理 ==========
  console.log('\n── M8: 发票管理 ──');

  // 获取客户ID
  const clientsRes = await api('GET', '/clients?page=1&pageSize=1', null, authHeaders);
  const clientId = clientsRes.json?.data?.data?.[0]?.id ?? clientsRes.json?.data?.[0]?.id;
  if (!clientId) { console.log('  ⚠️ 无客户数据，跳过部分M8测试'); }

  let invoiceId;
  if (clientId) {
    // Happy Path: 创建发票
    const createInv = await api('POST', '/invoices', {
      invoiceNo: `REG-TEST-${Date.now()}`,
      clientId,
      subtotal: 1000,
      taxRate: 13,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0]
    }, authHeaders);
    invoiceId = createInv.json?.data?.id;
    if ((createInv.status === 200 || createInv.status === 201) && invoiceId) record('POST /invoices 创建', 'PASS', `id=${invoiceId}`);
    else record('POST /invoices 创建', 'FAIL', JSON.stringify(createInv.json));

    // 列表
    const invList = await api('GET', '/invoices?page=1&pageSize=10', null, authHeaders);
    if (invList.status === 200 && invList.json?.success) record('GET /invoices 列表', 'PASS');
    else record('GET /invoices 列表', 'FAIL', JSON.stringify(invList.json));

    // 详情
    if (invoiceId) {
      const invDetail = await api('GET', `/invoices/${invoiceId}`, null, authHeaders);
      if (invDetail.status === 200 && invDetail.json?.success) record('GET /invoices/:id 详情', 'PASS');
      else record('GET /invoices/:id 详情', 'FAIL', JSON.stringify(invDetail.json));
    }

    // 统计
    const invStats = await api('GET', '/invoices/stats', null, authHeaders);
    if (invStats.status === 200 && invStats.json?.success) record('GET /invoices/stats', 'PASS');
    else record('GET /invoices/stats', 'FAIL', `status=${invStats.status}`);

    // Edge: 缺少必填字段 clientId
    const invMissing = await api('POST', '/invoices', { subtotal: 500 }, authHeaders);
    if (invMissing.status === 400 || invMissing.json?.success === false) record('POST /invoices 缺clientId', 'PASS', '正确拒绝');
    else record('POST /invoices 缺clientId', 'FAIL', `应拒绝但返回${invMissing.status}`);

    // Edge: 负数金额
    const invNegative = await api('POST', '/invoices', {
      invoiceNo: `NEG-TEST-${Date.now()}`,
      clientId,
      subtotal: -100,
      taxRate: 13
    }, authHeaders);
    if (invNegative.status === 400 || invNegative.json?.success === false) record('POST /invoices 负数金额', 'PASS', '正确拒绝');
    else record('POST /invoices 负数金额', 'FAIL', `应拒绝但返回${invNegative.status}, 可能允许负金额`);

    // Edge: 不存在的发票ID
    const invNotFound = await api('GET', '/invoices/99999', null, authHeaders);
    if (invNotFound.status === 404 || invNotFound.json?.success === false) record('GET /invoices/99999 不存在', 'PASS', `status=${invNotFound.status}`);
    else record('GET /invoices/99999 不存在', 'FAIL', `应404但返回${invNotFound.status}`);

    // Auth: 无token创建发票
    const invNoAuth = await api('POST', '/invoices', { invoiceNo: 'NOAUTH', clientId, subtotal: 100 }, noAuth);
    if (invNoAuth.status === 401) record('POST /invoices 无token', 'PASS', '正确拒绝 401');
    else record('POST /invoices 无token', 'FAIL', `应401但返回${invNoAuth.status}`);
  }

  // ========== M9: 文档管理 ==========
  console.log('\n── M9: 文档管理 ──');

  // Happy Path: 创建文档
  const createDoc = await api('POST', '/documents', {
    fileName: `reg-test-${Date.now()}.pdf`,
    originalName: '回归测试文档.pdf',
    filePath: '/uploads/documents/reg-test.pdf',
    fileSize: 2048,
    mimeType: 'application/pdf',
    category: 'CONTRACT',
    description: '回归测试文档',
    tags: ['回归', '测试'],
    ...(clientId ? { clientId } : {})
  }, authHeaders);
  const documentId = createDoc.json?.data?.id;
  if ((createDoc.status === 200 || createDoc.status === 201) && documentId) record('POST /documents 创建', 'PASS', `id=${documentId}`);
  else record('POST /documents 创建', 'FAIL', JSON.stringify(createDoc.json));

  // 列表
  const docList = await api('GET', '/documents?page=1&pageSize=10', null, authHeaders);
  if (docList.status === 200 && docList.json?.success) record('GET /documents 列表', 'PASS');
  else record('GET /documents 列表', 'FAIL', JSON.stringify(docList.json));

  // 详情
  if (documentId) {
    const docDetail = await api('GET', `/documents/${documentId}`, null, authHeaders);
    if (docDetail.status === 200 && docDetail.json?.success) record('GET /documents/:id 详情', 'PASS');
    else record('GET /documents/:id 详情', 'FAIL', JSON.stringify(docDetail.json));
  }

  // 更新
  if (documentId) {
    const docUpdate = await api('PUT', `/documents/${documentId}`, { category: 'EVIDENCE', description: '更新后' }, authHeaders);
    if (docUpdate.status === 200 && docUpdate.json?.success) record('PUT /documents/:id 更新', 'PASS', `category=${docUpdate.json.data?.category}`);
    else record('PUT /documents/:id 更新', 'FAIL', JSON.stringify(docUpdate.json));
  }

  // 统计
  const docStats = await api('GET', '/documents/stats', null, authHeaders);
  if (docStats.status === 200 && docStats.json?.success) record('GET /documents/stats', 'PASS');
  else record('GET /documents/stats', 'FAIL', `status=${docStats.status}`);

  // Edge: 缺少必填字段 fileName
  const docMissing = await api('POST', '/documents', { filePath: '/test', fileSize: 100, mimeType: 'text/plain' }, authHeaders);
  if (docMissing.status === 400 || docMissing.json?.success === false) record('POST /documents 缺fileName', 'PASS', '正确拒绝');
  else record('POST /documents 缺fileName', 'FAIL', `应拒绝但返回${docMissing.status}`);

  // Edge: 路径遍历攻击
  const docTraversal = await api('POST', '/documents', {
    fileName: '../../../etc/passwd',
    originalName: 'evil',
    filePath: '../../../etc/passwd',
    fileSize: 100,
    mimeType: 'text/plain'
  }, authHeaders);
  // 后端应接受元数据但不执行文件操作（仅存路径字符串），检查是否未做路径验证
  if (docTraversal.json?.success === true) {
    record('POST /documents 路径遍历', 'FAIL', '⚠️ 接受了 ../../../etc/passwd 路径，无路径验证');
    // 清理
    if (docTraversal.json.data?.id) await api('DELETE', `/documents/${docTraversal.json.data.id}`, null, authHeaders);
  } else {
    record('POST /documents 路径遍历', 'PASS', '正确拒绝路径遍历');
  }

  // Edge: 不存在的文档ID
  const docNotFound = await api('GET', '/documents/99999', null, authHeaders);
  if (docNotFound.status === 404 || docNotFound.json?.success === false) record('GET /documents/99999 不存在', 'PASS', `status=${docNotFound.status}`);
  else record('GET /documents/99999 不存在', 'FAIL', `应404但返回${docNotFound.status}`);

  // Auth: 无token
  const docNoAuth = await api('GET', '/documents', null, noAuth);
  if (docNoAuth.status === 401) record('GET /documents 无token', 'PASS', '正确拒绝 401');
  else record('GET /documents 无token', 'FAIL', `应401但返回${docNoAuth.status}`);

  // 清理: 删除测试文档和发票
  if (documentId) {
    const docDel = await api('DELETE', `/documents/${documentId}`, null, authHeaders);
    if (docDel.status === 200) record('DELETE /documents/:id 清理', 'PASS');
    else record('DELETE /documents/:id 清理', 'FAIL', `status=${docDel.status}`);
  }
  if (invoiceId) {
    const invDel = await api('DELETE', `/invoices/${invoiceId}`, null, authHeaders);
    if (invDel.status === 200) record('DELETE /invoices/:id 清理', 'PASS');
    else record('DELETE /invoices/:id 清理', 'FAIL', `status=${invDel.status}`);
  }

  // ========== 汇总 ==========
  console.log('\n═══════════════════════════════════════════');
  console.log('  全量回归测试汇总');
  console.log('═══════════════════════════════════════════');
  console.log(`通过: ${passed} | 失败: ${failed} | 跳过: ${skipped} | 总计: ${passed+failed+skipped}`);
  if (failed > 0) {
    console.log('\n❌ 失败项:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  • ${r.name} — ${r.detail}`));
    process.exit(1);
  } else {
    console.log('\n✅ 全部通过！');
  }
}

main().catch(e => { console.error('测试执行异常:', e); process.exit(1); });
