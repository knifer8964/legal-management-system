/**
 * 说明书插图批量截取脚本
 * 前置：应用以 --remote-debugging-port=9222 启动，后端 3000 可用
 * 用法：node scripts/capture-manual-shots.js
 * 输出：docs/manual/*.png
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const httpGetJson = (url) => new Promise((res, rej) => {
  http.get(url, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej);
});

const OUT = path.join(__dirname, '..', 'docs', 'manual');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const lr = await fetch('http://127.0.0.1:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123456' })
  });
  const lj = await lr.json();
  const token = lj.data.token;
  const user = JSON.stringify(lj.data.user);
  console.log('登录成功:', lj.data.user.name);

  let page = null;
  for (let i = 0; i < 40 && !page; i++) {
    try {
      const ts = await httpGetJson('http://127.0.0.1:9222/json/list');
      page = ts.find((t) => t.type === 'page' && /index\.html/.test(t.url));
    } catch (e) { /* retry */ }
    if (!page) await sleep(500);
  }
  if (!page) { console.log('未找到调试目标'); process.exit(1); }

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

  const evalx = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result && r.result.result && r.result.result.value;
  };
  const shot = async (name) => {
    const s = await send('Page.captureScreenshot', { format: 'png' });
    if (!s.result || !s.result.data) { console.log('  截图失败:', name); return; }
    const out = path.join(OUT, name + '.png');
    fs.writeFileSync(out, Buffer.from(s.result.data, 'base64'));
    console.log('  OK', name + '.png', Math.round(fs.statSync(out).size / 1024) + 'KB');
  };
  const goto = async (hash, wait) => { await evalx(`location.hash = ${JSON.stringify(hash)}`); await sleep(wait || 3500); };

  // --- 登录页（清空凭据后截取）---
  await evalx("localStorage.clear(); 'cleared'");
  await send('Page.reload', {});
  await sleep(4500);
  await goto('#/login', 2500);
  await shot('01-login');

  // --- 注入凭据，抓取各功能页 ---
  await evalx(`localStorage.setItem('token', ${JSON.stringify(token)}); localStorage.setItem('user', ${JSON.stringify(user)}); 'ok'`);
  await send('Page.reload', {});
  await sleep(7000);

  const routes = [
    ['dashboard', '02-dashboard'],
    ['clients', '03-clients'],
    ['matters', '04-matters'],
    ['tasks', '05-tasks'],
    ['time', '06-time-entries'],
    ['communications', '07-communications'],
    ['invoices', '08-invoices'],
    ['contracts', '09-contracts'],
    ['documents', '10-documents'],
    ['users', '11-users'],
    ['roles', '12-roles'],
    ['profile', '13-profile']
  ];
  for (const [r, n] of routes) {
    await goto('#/' + r, 3500);
    await shot(n);
  }

  ws.close();
  console.log('全部完成，输出目录:', OUT);
  process.exit(0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
