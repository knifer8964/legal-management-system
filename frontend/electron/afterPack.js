const fs = require('fs');
const path = require('path');

/**
 * electron-builder afterPack 钩子
 *
 * 背景：electron-builder 的 extraResources/files 复制会硬编码排除“根级 node_modules”
 * （见 app-builder-lib/out/util/filter.js: if (relative === "node_modules") return false;），
 * 因此后端的运行时依赖无法通过 extraResources 携带。这里在打包后用 Node 原生 fs.cpSync
 * 直接把 backend-prod/node_modules 复制进 win-unpacked/resources/backend/node_modules。
 */
module.exports = async function afterPack(context) {
  const appOutDir = context.appOutDir; // 例如 frontend/release/win-unpacked
  const projectDir = path.resolve(__dirname, '..', '..'); // legal-management-system
  const srcNm = path.join(projectDir, 'backend-prod', 'node_modules');
  const dstBackend = path.join(appOutDir, 'resources', 'backend');
  const dstNm = path.join(dstBackend, 'node_modules');

  if (!fs.existsSync(srcNm)) {
    throw new Error('[afterPack] 找不到后端运行时依赖: ' + srcNm);
  }

  fs.mkdirSync(dstBackend, { recursive: true });
  fs.rmSync(dstNm, { recursive: true, force: true });

  console.log('[afterPack] 复制后端 node_modules ->', dstNm);
  fs.cpSync(srcNm, dstNm, { recursive: true });

  const count = fs.readdirSync(dstNm).length;
  console.log(`[afterPack] 完成，共 ${count} 个顶层包`);
};
