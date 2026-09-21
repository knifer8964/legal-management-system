const http = require('http');
const fs = require('fs');
const path = require('path');

function httpGetJson(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
    }).on('error', rej);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const lr = await fetch('http://127.0.0.1:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123456' })
  });
  const lj = await lr.json();
  const token = lj.data.token;
  const user = JSON.stringify(lj.data.user);
  console.log('1) 取到 token, user =', lj.data.user.name);

  let page = null;
  for (let i = 0; i < 30 && !page; i++) {
    try {
      const ts = await httpGetJson('http://127.0.0.1:9222/json/list');
      page = ts.find((t) => t.type === 'page' && /index\.html/.test(t.url));
    } catch (e) { /* retry */ }
    if (!page) await sleep(500);
  }
  if (!page) { console.log('未找到调试目标'); process.exit(1); }
  console.log('2) 渲染进程目标:', page.url);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  await new Promise((r) => ws.addEventListener('open', r));
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

  await send('Runtime.enable');
  await send('Page.enable');

  let r = await send('Runtime.evaluate', {
    expression: `localStorage.setItem('token', ${JSON.stringify(token)}); localStorage.setItem('user', ${JSON.stringify(user)}); 'stored'`,
    returnByValue: true
  });
  console.log('3) 写入 localStorage:', r.result && r.result.result && r.result.result.value);

  await send('Runtime.evaluate', { expression: `location.hash = '#/dashboard'`, returnByValue: true });
  await sleep(600);
  await send('Page.reload', {});
  await sleep(8000);

  const loc = await send('Runtime.evaluate', { expression: 'location.href', returnByValue: true });
  console.log('4) 当前地址:', loc.result && loc.result.result && loc.result.result.value);

  r = await send('Runtime.evaluate', {
    expression: `(document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 1200)`,
    returnByValue: true
  });
  console.log('5) 页面文本:', r.result && r.result.result && r.result.result.value);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.result && shot.result.data) {
    const out = path.join(__dirname, 'dashboard.png');
    fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
    console.log('6) 截图已保存:', out);
  } else {
    console.log('6) 截图失败:', JSON.stringify(shot).slice(0, 300));
  }

  ws.close();
  process.exit(0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
