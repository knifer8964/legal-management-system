// 修复 InvoiceListPage.tsx 中的 U+FFFD 乱码字符
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'InvoiceListPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 替换映射：乱码 → 正确中文
const replacements = [
  // STATUS_CONFIG 标签
  ['已开\ufffd?', '已开具'],
  ['已发\ufffd?', '已发送'],
  ['已支\ufffd?', '已支付'],
  ['已取\ufffd?', '已取消'],
  // 表格列标题
  ['发票\ufffd?', '发票号'],
  ['状\ufffd?', '状态'],
  ['开具日\ufffd?', '开具日期'],
  ['到期\ufffd?', '到期日期'],
  // 操作描述
  ['确定要删除这张发票吗\ufffd?', '确定要删除这张发票吗？'],
  ['已删\ufffd?', '已删除'],
  // 统计卡片
  ['发票\ufffd? value', '发票数" value'],
  ['总金\ufffd? value', '总金额" value'],
  // 操作区注释
  ['操作\ufffd?', '操作区'],
  // 表单标签
  ['请输入金\ufffd?', '请输入金额'],
  ['状\ufffd? initialValue', '状态" initialValue'],
  ['状\ufffd?>', '状态">'],
  ['开具日\ufffd?>', '开具日期">'],
  // 支付弹窗
  ['发票\ufffd? <Text', '发票号: <Text'],
  ['请输入金\ufffd?', '请输入金额'],
];

let count = 0;
for (const [bad, good] of replacements) {
  while (content.includes(bad)) {
    content = content.replace(bad, good);
    count++;
  }
}

// 检查是否还有残留 U+FFFD
const remaining = (content.match(/\ufffd/g) || []).length;

fs.writeFileSync(filePath, content, 'utf8');
console.log(`替换完成: ${count} 处，残留 U+FFFD: ${remaining} 处`);
