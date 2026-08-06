const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
        Header, Footer, PageNumber } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: 'center',
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold, size: 21 })] })]
  });
}

function row(cells) {
  return new TableRow({ children: cells });
}

function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun(text)] });
}

function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 90 }, children: [new TextRun(text)] });
}

function p(text, opts = {}) {
  return new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text, ...opts })] });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun(text)]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "SimSun", size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "SimHei" },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "SimHei" },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "SimHei" },
        paragraph: { spacing: { before: 120, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: "bullet", text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "个人法务工作室管理系统 — 备份与恢复指南", size: 18, color: "666666" })] })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "第 ", size: 18 }),
        new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
        new TextRun({ text: " 页", size: 18 })
      ] })] })
    },
    children: [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: "个人法务工作室管理系统", bold: true, size: 44, font: "SimHei" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 },
        children: [new TextRun({ text: "备份与恢复指南", bold: true, size: 36, font: "SimHei" })]
      }),
      p("文档版本：v1.0", { italics: true }),
      p("生成日期：2026-08-04", { italics: true }),
      p("仓库地址：https://github.com/knifer8964/legal-management-system", { italics: true }),

      h2("一、项目概况"),
      p("本项目为“个人法务工作室管理系统”（Legal Management System），定位是一人法务公司的全部业务管理工具。系统覆盖客户管理、业务事项跟踪、任务看板、沟通记录、计时收费等核心模块，采用前后端分离架构，支持本地部署。"),

      h2("二、技术栈"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 7020],
        rows: [
          row([cell("层级", 2340, { bold: true, fill: "D5E8F0" }), cell("技术选型", 7020, { bold: true, fill: "D5E8F0" })]),
          row([cell("前端", 2340), cell("React 19 + Vite 8 + Ant Design 6 + Zustand + React Router 6 + TypeScript", 7020)]),
          row([cell("后端", 2340), cell("Node.js 20 + Express 4 + TypeScript 5 + Prisma 5.22", 7020)]),
          row([cell("数据库", 2340), cell("MySQL 8.4（端口 3306，库 legal_management）", 7020)]),
          row([cell("缓存", 2340), cell("Redis 3.0.504（端口 6379）", 7020)]),
          row([cell("包管理", 2340), cell("npm 11 / 使用 C:\\Program Files\\nodejs\\node.exe（Node v24.18.0）", 7020)]),
        ]
      }),

      h2("三、数据库信息"),
      p("MySQL 连接信息："),
      bullet("主机：127.0.0.1:3306"),
      bullet("用户名：root"),
      bullet("密码：root123456"),
      bullet("数据库：legal_management"),
      bullet("表数量：12 张核心表（users / roles / clients / matters / communications / tasks / time_entries / invoices / documents / enterprise_configs / timeline_events / system_logs）"),
      p("Redis 连接信息：127.0.0.1:6379，无密码。"),

      h2("四、登录信息"),
      p("系统预置测试账号（seed 数据）："),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 3120, 3120],
        rows: [
          row([cell("用户名", 3120, { bold: true, fill: "D5E8F0" }), cell("密码", 3120, { bold: true, fill: "D5E8F0" }), cell("角色", 3120, { bold: true, fill: "D5E8F0" })]),
          row([cell("admin", 3120), cell("123456", 3120), cell("管理员", 3120)]),
          row([cell("zhangsan", 3120), cell("123456", 3120), cell("律师", 3120)]),
          row([cell("lisi", 3120), cell("123456", 3120), cell("助理", 3120)]),
        ]
      }),

      h2("五、服务启动与停止"),
      h3("5.1 一键启动"),
      p("在项目根目录执行以下批处理文件："),
      bullet("法务系统-启动.bat — 启动 MySQL、Redis、后端（3000）、前端 Vite dev（5173）"),
      bullet("法务系统-停止.bat — 停止上述所有服务"),
      h3("5.2 手动启动"),
      bullet("MySQL：mysqld.exe --defaults-file=C:\\my.ini"),
      bullet("Redis：redis-server.exe"),
      bullet("后端：cd backend && npm run build && npm run start（或 node dist/index.js）"),
      bullet("前端：cd frontend && npm run dev（5173）或 npm run preview（4173）"),

      h2("六、环境要求"),
      bullet("Windows 10/11（当前开发/部署环境）"),
      bullet("Node.js LTS v24.18.0（安装路径 C:\\Program Files\\nodejs\\）"),
      bullet("MySQL Server 8.4（端口 3306）"),
      bullet("Redis 3.x+（端口 6379）"),
      bullet("Git 2.54.0+，凭据已存 ~/.git-credentials，可自动 push"),

      h2("七、M1-M6 已完成模块清单"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1200, 2400, 2400, 3360],
        rows: [
          row([cell("M#", 1200, { bold: true, fill: "D5E8F0" }), cell("模块", 2400, { bold: true, fill: "D5E8F0" }), cell("状态", 2400, { bold: true, fill: "D5E8F0" }), cell("说明", 3360, { bold: true, fill: "D5E8F0" })]),
          row([cell("M1", 1200), cell("数据库 Schema 重构", 2400), cell("✅ 完成", 2400), cell("Prisma v5.22，12 张核心表", 3360)]),
          row([cell("M2", 1200), cell("客户管理 API", 2400), cell("✅ 完成", 2400), cell("7 个接口，含 stats / :id/matters", 3360)]),
          row([cell("M3", 2400), cell("业务事项 API", 2400), cell("✅ 完成", 2400), cell("8 个接口，自动生成 matterNo", 3360)]),
          row([cell("M4", 1200), cell("任务管理 API", 2400), cell("✅ 完成", 2400), cell("5 个接口，含 toggle", 3360)]),
          row([cell("M5", 1200), cell("沟通记录 & 计时收费 API", 2400), cell("✅ 完成", 2400), cell("5+5 个接口，start/stop/manual", 3360)]),
          row([cell("M6", 1200), cell("前端页面重建", 2400), cell("✅ 完成", 2400), cell("6 个核心页面 + 登录 + 布局", 3360)]),
        ]
      }),

      h2("八、M7+ 待完成模块规划"),
      bullet("M7：用户管理 & 权限管理（users/roles 路由 + 用户管理页面）"),
      bullet("M8：发票管理（Invoice 模型已有，需接口与页面）"),
      bullet("M9：文档管理（Document 模型已有，需接口与页面）"),
      bullet("M10：仪表盘增强 & 统计报表（/stats 接口 + 图表）"),
      bullet("M11：系统设置 & 企业配置"),
      bullet("M12：Electron 桌面端封装"),
      bullet("M13：微信/邮件通讯集成"),

      h2("九、常见问题与绕过方案"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 6240],
        rows: [
          row([cell("问题", 3120, { bold: true, fill: "D5E8F0" }), cell("解决方案", 6240, { bold: true, fill: "D5E8F0" })]),
          row([cell("PowerShell 环境变量污染/乱码", 3120), cell("使用 .bat 批处理 + cmd.exe /c 执行命令，避免 PowerShell 管道解析问题", 6240)]),
          row([cell("Vite 8 rolldown 与 type-only 导出冲突", 3120), cell("frontend/tsconfig.app.json 中 verbatimModuleSyntax 已设为 false", 6240)]),
          row([cell("npx tsc 安装错误版本", 3120), cell("使用 ./node_modules/.bin/tsc 或 npm run build，不要直接使用 npx tsc", 6240)]),
          row([cell("Git push 在 PowerShell 中 exit code 1", 3120), cell("PowerShell stderr 重定向导致误报，实际推送成功，可忽略或用 cmd /c 执行", 6240)]),
          row([cell("前端白屏/运行时异常", 3120), cell("main.tsx 已添加全局 ErrorBoundary，可将运行时错误渲染到页面上便于定位", 6240)]),
          row([cell("xb 浏览器自动化不可用", 3120), cell("使用 curl 与 PowerShell 进行 API/静态资源验证，或使用 Vite build 自检", 6240)]),
        ]
      }),

      h2("十、备份与恢复步骤"),
      h3("10.1 代码备份"),
      p("代码已全部托管至 GitHub：https://github.com/knifer8964/legal-management-system"),
      bullet("每次里程碑完成后执行：git add -A && git commit -m 中文说明 && git push origin master"),
      bullet("本地仓库路径：C:\\Users\\gate\\.qclaw\\workspace-agent-d64c8186\\legal-management-system"),
      h3("10.2 数据库备份"),
      p("使用 mysqldump 导出："),
      p("mysqldump -u root -proot123456 legal_management > legal_management_backup_YYYYMMDD_HHMMSS.sql", { font: "Consolas", size: 20 }),
      p("恢复："),
      p("mysql -u root -proot123456 legal_management < legal_management_backup_YYYYMMDD_HHMMSS.sql", { font: "Consolas", size: 20 }),
      h3("10.3 全新环境恢复流程"),
      bullet("git clone https://github.com/knifer8964/legal-management-system.git"),
      bullet("安装 Node.js LTS v24.18.0 并确认 node/npm 在 PATH"),
      bullet("安装 MySQL 8.4 与 Redis，创建数据库 legal_management"),
      bullet("cd backend && npm install && npx prisma migrate deploy && npx prisma db seed"),
      bullet("cd frontend && npm install"),
      bullet("启动 MySQL、Redis，然后执行后端 build 与前端 dev"),
      bullet("访问 http://127.0.0.1:5173，使用 admin / 123456 登录"),

      h2("十一、联系方式"),
      p("如有问题，请在 GitHub Issues 中提交，或联系项目维护者。")
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = 'C:\\Users\\gate\\.qclaw\\workspace-agent-d64c8186\\legal-management-system\\个人法务工作室管理系统_备份与恢复指南.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('DOCX generated:', outPath);
});
