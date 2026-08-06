const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, 'frontend/src/pages');
const files = fs.readdirSync(base).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
let hasBad = false;
for (const f of files) {
  const full = path.join(base, f);
  const c = fs.readFileSync(full, 'utf8');
  const lines = c.split(/\r?\n/);
  for (const line of lines) {
    if (line.includes('import') && (line.includes('../../stores/') || line.includes('../../types/'))) {
      console.log('BAD', f, line.trim());
      hasBad = true;
    }
  }
}
if (!hasBad) console.log('[OK] All import paths are valid.');
process.exit(hasBad ? 1 : 0);
