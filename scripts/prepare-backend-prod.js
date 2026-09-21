/**
 * 生成 backend-prod —— 供 Electron 安装包携带的“后端运行时”目录。
 *
 * 为什么需要它：
 *   1. 打包时只需要运行时依赖，不需要 devDependencies（可省 ~290MB）。
 *   2. electron-builder 的 extraResources 会硬编码排除“根级 node_modules”，
 *      因此 node_modules 由 electron/afterPack.js 钩子在打包后单独复制。
 *   3. prisma 的 query engine、bcrypt 的 napi 原生绑定必须一并带上，
 *      否则 Electron 内置 Node 启动后端会报 Cannot find module / .node 加载失败。
 *
 * 用法： node scripts/prepare-backend-prod.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'backend');
const dst = path.join(root, 'backend-prod');

const rmrf = (p) => { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); };
const copy = (s, d) => { fs.cpSync(s, d, { recursive: true }); };
const sizeMB = (p) => {
  if (!fs.existsSync(p)) return 0;
  let sum = 0;
  for (const f of fs.readdirSync(p, { withFileTypes: true })) {
    const fp = path.join(p, f.name);
    if (f.isDirectory()) sum += sizeMB(fp) * 1024 * 1024;
    else { try { sum += fs.statSync(fp).size; } catch { /* ignore */ } }
  }
  return sum / 1024 / 1024;
};

console.log('Source:', src);
console.log('Target:', dst);

rmrf(dst);
fs.mkdirSync(dst, { recursive: true });

// 1) 编译产物
copy(path.join(src, 'dist'), path.join(dst, 'dist'));

// 2) Prisma schema + migrations + 种子数据库
fs.mkdirSync(path.join(dst, 'prisma'), { recursive: true });
fs.copyFileSync(path.join(src, 'prisma', 'schema.prisma'), path.join(dst, 'prisma', 'schema.prisma'));
copy(path.join(src, 'prisma', 'migrations'), path.join(dst, 'prisma', 'migrations'));
fs.copyFileSync(path.join(src, 'prisma', 'dev.db'), path.join(dst, 'prisma', 'dev.db'));

// 3) .env —— 生产环境由 Electron 注入 DATABASE_URL / CORS_ORIGIN，这里保留基线
fs.copyFileSync(path.join(src, '.env'), path.join(dst, '.env'));

// 4) package.json：@prisma/client 属于运行时依赖，从 devDependencies 移到 dependencies
const pkg = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));
pkg.dependencies = pkg.dependencies || {};
if (pkg.devDependencies && pkg.devDependencies['@prisma/client']) {
  pkg.dependencies['@prisma/client'] = pkg.devDependencies['@prisma/client'];
  delete pkg.devDependencies['@prisma/client'];
}
pkg.scripts = { start: 'node dist/index.js' };
delete pkg.prisma;
fs.writeFileSync(path.join(dst, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');

// 5) 安装生产依赖
console.log('安装生产依赖 (npm install --omit=dev)...');
execSync('npm install --omit=dev --no-audit --no-fund', { cwd: dst, stdio: 'inherit' });

// 6) 复制 Prisma 生成的客户端（含 query engine）
const prismaSrc = path.join(src, 'node_modules', '.prisma');
const prismaDst = path.join(dst, 'node_modules', '.prisma');
if (fs.existsSync(prismaSrc)) {
  rmrf(prismaDst);
  copy(prismaSrc, prismaDst);
  console.log('已复制 .prisma 客户端');
} else {
  throw new Error('未找到 backend/node_modules/.prisma，请先在 backend 执行 prisma generate');
}

// 7) 复制 bcrypt 原生绑定（napi-v3）
const bcryptBinding = path.join('bcrypt', 'lib', 'binding', 'napi-v3', 'bcrypt_lib.node');
const bcSrc = path.join(src, 'node_modules', bcryptBinding);
const bcDst = path.join(dst, 'node_modules', bcryptBinding);
if (fs.existsSync(bcSrc)) {
  fs.mkdirSync(path.dirname(bcDst), { recursive: true });
  fs.copyFileSync(bcSrc, bcDst);
  console.log('已复制 bcrypt 原生绑定');
} else {
  throw new Error('未找到 bcrypt 原生绑定: ' + bcSrc);
}

// 8) 精简：删除运行时不需要的大体积/工具包与临时文件
const trim = [
  path.join(dst, 'node_modules', '@prisma', 'engines'), // 89MB，运行时不需要
  path.join(dst, 'node_modules', 'prisma'),             // CLI，运行时不需要
  path.join(dst, 'node_modules', '.cache'),
];
for (const p of trim) {
  if (fs.existsSync(p)) { rmrf(p); console.log('已精简:', p.replace(dst, '')); }
}
// 清理 Prisma 引擎的 .tmp 残留（中断的 prisma generate 会留下 query_engine-*.node.tmpNNNN）
const pruneTmp = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) pruneTmp(fp);
    else if (f.name.includes('.tmp')) { fs.rmSync(fp, { force: true }); console.log('已清理 tmp:', f.name); }
  }
};
pruneTmp(prismaDst);

// 9) 清理测试日志残留
for (const f of ['logs', '_out.log', '_err.log', '_eout.log', '_eerr.log', 'package-lock.json']) {
  rmrf(path.join(dst, f));
}

const topPkgs = fs.readdirSync(path.join(dst, 'node_modules')).length;
console.log(`\nOK: backend-prod 已生成 —— 顶层包 ${topPkgs} 个，体积 ${sizeMB(dst).toFixed(1)} MB`);
