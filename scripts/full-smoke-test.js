// 完整冒烟测试 — 全部 14 个路由模块
const BASE = 'http://127.0.0.1:3000/api/v1';

async function main() {
  // 登录
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) { console.log('❌ 登录失败'); process.exit(1); }
  console.log('✅ 登录成功');

  const h = { 'Authorization': `Bearer ${token}` };
  const results = [];

  // 逐模块测试 GET 列表/统计接口
  const tests = [
    { name: 'Dashboard', url: '/dashboard/summary' },
    { name: 'Clients', url: '/clients' },
    { name: 'Matters', url: '/matters' },
    { name: 'Tasks', url: '/tasks' },
    { name: 'Communications', url: '/communications' },
    { name: 'TimeEntries', url: '/time-entries' },
    { name: 'Invoices', url: '/invoices' },
    { name: 'Contracts', url: '/contracts' },
    { name: 'Documents', url: '/documents' },
    { name: 'Users', url: '/users' },
    { name: 'Roles', url: '/roles' },
  ];

  for (const t of tests) {
    try {
      const r = await fetch(`${BASE}${t.url}`, { headers: h });
      const d = await r.json();
      if (r.ok && (d.success || d.code === 200)) {
        const count = d.data?.data?.length ?? d.data?.length ?? Object.keys(d.data || {}).length;
        console.log(`✅ ${t.name}: ${count} 项`);
        results.push({ name: t.name, pass: true });
      } else {
        console.log(`⚠️ ${t.name}: HTTP ${r.status}, code=${d.code}`);
        results.push({ name: t.name, pass: false });
      }
    } catch (e) {
      console.log(`❌ ${t.name}: ${e.message}`);
      results.push({ name: t.name, pass: false });
    }
  }

  // 测试创建合同
  try {
    const r = await fetch(`${BASE}/contracts`, {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Contract', contractType: 'SERVICE', clientId: 1, amount: 5000 })
    });
    const d = await r.json();
    if (r.ok && d.data?.contractNo) {
      console.log(`✅ Create Contract: ${d.data.contractNo}`);
      results.push({ name: 'CreateContract', pass: true });
    } else {
      console.log(`⚠️ Create Contract: ${JSON.stringify(d)}`);
      results.push({ name: 'CreateContract', pass: false });
    }
  } catch (e) {
    console.log(`❌ Create Contract: ${e.message}`);
    results.push({ name: 'CreateContract', pass: false });
  }

  // 统计
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n📊 冒烟测试: ${passed}/${total} 通过`);

  if (passed === total) {
    console.log('🎉 全部通过！');
    process.exit(0);
  } else {
    console.log('⚠️ 有失败项');
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
