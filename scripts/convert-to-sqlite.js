// 将 Prisma schema 从 MySQL 转为 SQLite
// 移除所有 @db.* 类型注解，将 provider 改为 sqlite
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'backend', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// 1. 改 provider
content = content.replace('provider = "mysql"', 'provider = "sqlite"');

// 2. 移除所有 @db.* 注解（包括带参数的如 @db.VarChar(50)、@db.Decimal(10, 2)）
content = content.replace(/\s+@db\.\w+(\([^)]*\))?/g, '');

// 3. 写回
fs.writeFileSync(schemaPath, content, 'utf8');

// 统计
const lines = content.split('\n');
console.log(`Done. ${lines.length} lines. Provider: sqlite. All @db.* annotations removed.`);
