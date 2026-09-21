const http = require('http');
const fs = require('fs');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const httpGetJson = (url) => new Promise((res, rej) => {
  http.get(url, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej);
});

(async () => {
  const [route = '#/dashboard', outName = 'shot.png'] = process.argv.slice(2);
  const ts = await httpGetJson('http://127.0.0.1:9222/json/list');
  const page = ts.find((t) => t.type === 'page' && /index\.html/.test(t.url));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  await new Promise((r) => ws.addEventListener('open', r));
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Runtime.evaluate', { expression: `location.hash = ${JSON.stringify(route)}`, returnByValue: true });
  await sleep(3500);
  const r = await send('Runtime.evaluate', { expression: `document.body.innerText.replace(/\\s+/g,' ').slice(0,400)`, returnByValue: true });
  console.log('路由', route, '文本:', r.result && r.result.result && r.result.result.value);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const out = path.isAbsolute(outName) ? outName : path.join(__dirname, outName);
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('已保存:', out);
  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
