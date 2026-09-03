const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1', port: 3000,
      path: '/api/v1' + path, method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const r = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  // 登录
  const login = await req('POST', '/auth/login', { username: 'admin', password: '123456' });
  const token = login.json.data.token;
  console.log('[LOGIN]', login.status, 'token len=' + token.length);

  // Dashboard summary
  const dash = await req('GET', '/dashboard/summary', null, token);
  console.log('[DASHBOARD]', dash.status);
  if (dash.json.success) {
    const d = dash.json.data;
    console.log('  clients:', JSON.stringify(d.clients));
    console.log('  matters:', JSON.stringify(d.matters));
    console.log('  tasks:', JSON.stringify(d.tasks));
    console.log('  timeEntries:', JSON.stringify(d.timeEntries));
    console.log('  invoices:', JSON.stringify(d.invoices));
    console.log('  documents:', JSON.stringify(d.documents));
    console.log('  recentMatters:', d.recentMatters.length);
    console.log('  upcomingTasks:', d.tasks.upcomingTasks.length);
    console.log('  overdueTasks:', d.tasks.overdueTasks.length);
    console.log('  upcomingDeadlines:', d.matters.upcomingDeadlines.length);
    console.log('\n✅ Dashboard /summary 接口正常');
  } else {
    console.log('❌ Dashboard 失败:', JSON.stringify(dash.json));
    process.exit(1);
  }

  // 无 token 应 401
  const noAuth = await req('GET', '/dashboard/summary', null, null);
  console.log('[NO-AUTH]', noAuth.status, noAuth.status === 401 ? '✅ 401' : '❌');
  if (noAuth.status !== 401) process.exit(1);
})();
