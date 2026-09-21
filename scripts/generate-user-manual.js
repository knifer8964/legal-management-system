/**
 * 生成《公司法务智慧管理系统 · 安装部署与使用说明书》.docx
 * 用法：node scripts/generate-user-manual.js
 * 插图来源：docs/manual/*.png（由 scripts/capture-manual-shots.js 生成）
 */
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
        Header, Footer, PageNumber, ImageRun, PageBreak } = require('docx');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SHOT = path.join(ROOT, 'docs', 'manual');
const OUT = process.argv[2] || path.join(ROOT, 'docs', '公司法务智慧管理系统_安装部署与使用说明书.docx');

const W = 9026; // 内容宽度 (A4 11906 - 左右各 1440)

/* ---------------- 基础样式工具 ---------------- */
const border = { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
const FILL_HEAD = "D5E8F0";

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function cell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: opts.fill || "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: 'center',
    children: [new Paragraph({
      spacing: { line: 300 },
      children: [new TextRun({ text: String(text), bold: !!opts.bold, size: opts.size || 20, color: opts.color })]
    })]
  });
}
function row(cells) { return new TableRow({ children: cells }); }

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    spacing: { before: 120, after: 200 },
    children: [new TextRun(text)]
  });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 90 }, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { before: 60, after: 60, line: 340 },
    children: [new TextRun({ text, ...opts, align: undefined })]
  });
}
function note(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80, line: 340 },
    shading: { fill: "FFF7E6", type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: "FAAD14", space: 6 } },
    children: [new TextRun({ text, size: 20 })]
  });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: 40, after: 40, line: 330 }, children: [new TextRun({ text, size: 20 })] });
}
function num(text, ref) {
  return new Paragraph({ numbering: { reference: ref || "numbers1", level: 0 }, spacing: { before: 40, after: 40, line: 330 }, children: [new TextRun({ text, size: 20 })] });
}
function code(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 300 },
    shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
    children: [new TextRun({ text, font: "Consolas", size: 19 })]
  });
}
/** 插图 + 图注，返回段落数组 */
function figure(name, caption) {
  const file = path.join(SHOT, name + '.png');
  if (!fs.existsSync(file)) return [p('[缺少插图: ' + name + '.png]', { color: 'FF0000' })];
  const { width, height } = pngSize(file);
  const w = 600;
  const h = Math.round((w * height) / width);
  const out = [new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 60 },
    children: [new ImageRun({
      type: 'png',
      data: fs.readFileSync(file),
      transformation: { width: w, height: h },
      altText: { title: caption, description: caption, name: name }
    })]
  })];
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 220 },
    children: [new TextRun({ text: caption, size: 18, color: '595959', italics: true })]
  }));
  return out;
}

/* ---------------- 文档内容 ---------------- */
const children = [];

// —— 封面 ——
children.push(
  new Paragraph({ spacing: { before: 2400, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '公司法务智慧管理系统', bold: true, size: 52, font: 'SimHei' })] }),
  new Paragraph({ spacing: { after: 240 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '安装 · 部署 · 使用说明书', bold: true, size: 36, font: 'SimHei', color: '1F4E79' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 },
    children: [new TextRun({ text: 'Legal Management System  ·  Desktop Edition', size: 22, color: '808080' })] }),
  new Table({
    width: { size: 5400, type: WidthType.DXA },
    columnWidths: [2000, 3400],
    rows: [
      row([cell('软件版本', 2000, { bold: true, fill: FILL_HEAD }), cell('v1.0.1（Windows x64）', 3400)]),
      row([cell('文档版本', 2000, { bold: true, fill: FILL_HEAD }), cell('V1.0', 3400)]),
      row([cell('文档日期', 2000, { bold: true, fill: FILL_HEAD }), cell('2026-09-21', 3400)]),
      row([cell('适用对象', 2000, { bold: true, fill: FILL_HEAD }), cell('系统管理员 / 终端用户', 3400)]),
    ]
  }),
  new Paragraph({ spacing: { before: 1200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '本文档中的所有界面截图均取自 v1.0.1 正式安装版实测环境。', size: 18, color: '808080' })] })
);

// —— 目录（静态） ——
const toc = [
  ['一、系统简介', ['1.1 产品定位', '1.2 功能模块一览']],
  ['二、运行环境', ['2.1 硬件要求', '2.2 软件依赖']],
  ['三、安装指南', ['3.1 安装包说明', '3.2 图形化安装（推荐）', '3.3 静默安装（批量部署）', '3.4 安装目录结构', '3.5 首次启动与登录', '3.6 升级与卸载']],
  ['四、功能使用说明', ['4.1 登录界面', '4.2 仪表盘', '4.3 客户管理', '4.4 业务事项', '4.5 任务管理', '4.6 计时收费', '4.7 沟通记录', '4.8 发票管理', '4.9 合同管理', '4.10 文档管理', '4.11 用户管理', '4.12 角色管理', '4.13 个人中心']],
  ['五、部署与运维', ['5.1 数据存储位置', '5.2 服务、端口与进程', '5.3 日志', '5.4 数据备份与恢复', '5.5 迁移到新电脑', '5.6 常用命令行操作']],
  ['六、常见问题（FAQ）', []],
  ['七、附录', ['7.1 预置账号', '7.2 技术架构', '7.3 快捷操作速查']],
];
children.push(new Paragraph({
  heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 240 },
  children: [new TextRun('目  录')]
}));
for (const [chapter, sections] of toc) {
  children.push(new Paragraph({ spacing: { before: 100, after: 20 }, children: [new TextRun({ text: chapter, bold: true, size: 22 })] }));
  for (const s of sections) {
    children.push(new Paragraph({ spacing: { before: 0, after: 0 }, indent: { left: 480 }, children: [new TextRun({ text: s, size: 20, color: '404040' })] }));
  }
}

/* ============ 一、系统简介 ============ */
children.push(h1('一、系统简介'));
children.push(h2('1.1 产品定位'));
children.push(p('公司法务智慧管理系统（Legal Management System）是一套面向公司法务部门与个人法务工作室的一体化业务管理软件，覆盖客户、业务事项、任务、沟通、计时收费、发票、合同、文档等日常法务工作的全流程。'));
children.push(p('系统以桌面应用（Windows 客户端）形态交付，安装包内已集成全部运行时与数据库引擎，安装即用，无需另行部署 Node.js、数据库或缓存服务。所有业务数据均保存在本机，不依赖任何云服务，适合对数据私密性要求较高的使用场景。'));
children.push(bullet('开箱即用：一个安装包完成全部部署，目标电脑无需任何前置环境。'));
children.push(bullet('数据本地化：数据库为嵌入式 SQLite，存放于用户数据目录，可随时打包带走。'));
children.push(bullet('离线可用：除首次安装包分发外，运行过程完全不需要网络。'));
children.push(bullet('单机多账号：支持多用户账号与角色权限，数据集中存储于本机数据库。'));

children.push(h2('1.2 功能模块一览'));
children.push(new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [1600, 7426],
  rows: [
    row([cell('模块', 1600, { bold: true, fill: FILL_HEAD }), cell('主要功能', 7426, { bold: true, fill: FILL_HEAD })]),
    row([cell('仪表盘', 1600), cell('经营概览统计卡片、业务状态分布 / 任务状态 / 发票金额图表、逾期任务提醒、近期业务列表', 7426)]),
    row([cell('客户管理', 1600), cell('企业 / 个人客户档案、联系人与联系方式、服务计划与月费、客户名下业务关联、状态管理', 7426)]),
    row([cell('业务事项', 1600), cell('业务编号自动生成、类型 / 费用类型 / 优先级 / 进度 / 截止日期、按客户关联、状态流转', 7426)]),
    row([cell('任务管理', 1600), cell('四列看板（待办 / 进行中 / 已完成 / 已取消）、负责人指派、优先级、关联业务、一键完成', 7426)]),
    row([cell('计时收费', 1600), cell('开始 / 停止计时、手工补录工时、按「时长 × 费率」自动计算金额、按业务与客户归集、计费与开票标记', 7426)]),
    row([cell('沟通记录', 1600), cell('微信 / 邮件 / 电话 / 面谈等多渠道记录、收发方向、主题与联系人、按客户归档', 7426)]),
    row([cell('发票管理', 1600), cell('发票开具、明细项、税额与总额自动计算、多次分期付款登记、收款进度统计', 7426)]),
    row([cell('合同管理', 1600), cell('合同全生命周期（草稿→审查中→待签订→已签订→执行中→已完成 / 已终止 / 已过期）、自动编号、状态流转、审批与时间线', 7426)]),
    row([cell('文档管理', 1600), cell('文件上传 / 下载、分类归档、按客户与业务关联、容量统计', 7426)]),
    row([cell('用户管理', 1600), cell('账号新增 / 编辑、角色分配、账号状态、重置密码', 7426)]),
    row([cell('角色管理', 1600), cell('角色与权限码配置、角色下用户数统计', 7426)]),
    row([cell('个人中心', 1600), cell('查看当前登录账号的资料与权限范围', 7426)]),
  ]
}));

/* ============ 二、运行环境 ============ */
children.push(h1('二、运行环境'));
children.push(h2('2.1 硬件要求'));
children.push(new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [2400, 3313, 3313],
  rows: [
    row([cell('项目', 2400, { bold: true, fill: FILL_HEAD }), cell('最低配置', 3313, { bold: true, fill: FILL_HEAD }), cell('推荐配置', 3313, { bold: true, fill: FILL_HEAD })]),
    row([cell('操作系统', 2400), cell('Windows 10 64 位', 3313), cell('Windows 11 64 位', 3313)]),
    row([cell('处理器', 2400), cell('双核 2.0 GHz', 3313), cell('四核及以上', 3313)]),
    row([cell('内存', 2400), cell('4 GB', 3313), cell('8 GB 及以上', 3313)]),
    row([cell('磁盘空间', 2400), cell('1 GB（程序 530 MB + 数据）', 3313), cell('2 GB 以上', 3313)]),
    row([cell('显示分辨率', 2400), cell('1024 × 768', 3313), cell('1440 × 900 及以上', 3313)]),
    row([cell('网络', 2400), cell('无需联网（单机运行）', 3313), cell('—', 3313)]),
  ]
}));

children.push(h2('2.2 软件依赖'));
children.push(p('本系统为自包含桌面应用，安装包中已内置以下组件，目标电脑无需额外安装任何软件：'));
children.push(bullet('Electron 42.3.0 运行时（内含 Chromium 148 浏览器内核与 Node.js 运行时）'));
children.push(bullet('后端服务程序（Express + Prisma ORM）'));
children.push(bullet('SQLite 嵌入式数据库引擎（含初始数据库）'));
children.push(bullet('前端界面静态资源'));
children.push(note('提示：安装到 C:\\Program Files 需要管理员权限；若系统弹出「用户账户控制(UAC)」提示，请选择「是」。'));

/* ============ 三、安装指南 ============ */
children.push(h1('三、安装指南'));
children.push(h2('3.1 安装包说明'));
children.push(new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [3610, 1804, 1804, 1808],
  rows: [
    row([cell('安装包文件', 3610, { bold: true, fill: FILL_HEAD }), cell('版本', 1804, { bold: true, fill: FILL_HEAD }), cell('大小', 1804, { bold: true, fill: FILL_HEAD }), cell('架构', 1808, { bold: true, fill: FILL_HEAD })]),
    row([cell('公司法务智慧管理系统 Setup 1.0.1.exe', 3610), cell('1.0.1', 1804), cell('129.6 MB', 1804), cell('Windows x64', 1808)]),
  ]
}));
children.push(p('安装包采用 NSIS 制作，支持图形化安装与静默安装两种方式。'));

children.push(h2('3.2 图形化安装（推荐）'));
children.push(num('双击安装包文件，启动安装向导。', 'numbers1'));
children.push(num('阅读并接受许可协议后进入安装路径选择页，默认安装目录为 C:\\Program Files\\legal-management-system，可点击「浏览」更换。', 'numbers1'));
children.push(num('按需勾选「创建桌面快捷方式」与「创建开始菜单快捷方式」（默认均勾选）。', 'numbers1'));
children.push(num('点击「安装」，等待进度条完成（约 1～2 分钟，视磁盘速度而定）。', 'numbers1'));
children.push(num('安装完成后可选择「立即运行」，或稍后从桌面 / 开始菜单启动。', 'numbers1'));
children.push(note('静默安装（/S）不会创建桌面快捷方式。如需桌面图标，请使用图形化安装，或按 3.3 节说明处理。'));

children.push(h2('3.3 静默安装（批量部署）'));
children.push(p('适用于机房批量部署或运维脚本，安装过程无任何界面：'));
children.push(code('公司法务智慧管理系统 Setup 1.0.1.exe /S'));
children.push(p('常用参数说明：'));
children.push(new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [2400, 6626],
  rows: [
    row([cell('参数', 2400, { bold: true, fill: FILL_HEAD }), cell('说明', 6626, { bold: true, fill: FILL_HEAD })]),
    row([cell('/S', 2400), cell('静默安装，使用全部默认选项，无界面', 6626)]),
    row([cell('/D=<路径>', 2400), cell('指定安装目录。必须是命令行最后一个参数，且路径不能加引号，例如 /D=D:\\Apps\\legal', 6626)]),
    row([cell('/allusers', 2400), cell('为所有用户安装（安装到 Program Files，需管理员权限）', 6626)]),
  ]
}));
children.push(note('注意：/D= 后面的路径若本身含空格，NSIS 会原样解析，请不要使用引号包裹路径。'));

children.push(h2('3.4 安装目录结构'));
children.push(new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [4213, 4813],
  rows: [
    row([cell('路径', 4213, { bold: true, fill: FILL_HEAD }), cell('说明', 4813, { bold: true, fill: FILL_HEAD })]),
    row([cell('公司法务智慧管理系统.exe', 4213), cell('主程序（Electron 运行时，约 216 MB）', 4813)]),
    row([cell('resources\\app.asar', 4213), cell('前端界面与主进程代码（约 103 MB）', 4813)]),
    row([cell('resources\\backend\\', 4213), cell('后端服务（约 76 MB，含依赖、Prisma 引擎与初始数据库模板）', 4813)]),
    row([cell('resources\\backend\\dist\\index.js', 4213), cell('后端服务入口文件', 4813)]),
    row([cell('resources\\backend\\prisma\\dev.db', 4213), cell('初始（种子）数据库，首次启动时复制到用户数据目录', 4813)]),
    row([cell('resources\\backend\\.env', 4213), cell('后端默认配置（端口、数据库路径等，可被主程序覆盖）', 4813)]),
    row([cell('Uninstall 公司法务智慧管理系统.exe', 4213), cell('卸载程序', 4813)]),
  ]
}));

children.push(h2('3.5 首次启动与登录'));
children.push(p('启动方式（任选其一）：'));
children.push(bullet('双击桌面快捷方式「公司法务智慧管理系统」'));
children.push(bullet('开始菜单 → 公司法务智慧管理系统'));
children.push(bullet('直接运行 C:\\Program Files\\legal-management-system\\公司法务智慧管理系统.exe'));
children.push(p('首次启动时程序会自动完成后端服务初始化（约 5～15 秒），随后显示登录界面。'));
children.push(...figure('01-login', '图 1  系统登录界面'));
children.push(p('预置管理员账号：admin / 123456。首次登录后建议在「用户管理」中修改密码。'));

children.push(h2('3.6 升级与卸载'));
children.push(h3('升级'));
children.push(p('直接运行新版本的安装包，安装程序会自动识别已安装的旧版本并执行原地覆盖升级，安装目录与业务数据均保持不变。'));
children.push(note('本系统使用固定的应用标识，安装包升级不会产生第二份安装目录，也不会重置数据。'));
children.push(h3('卸载'));
children.push(p('方式一：Windows「设置 → 应用 → 已安装的应用」中找到「公司法务智慧管理系统」，点击卸载。'));
children.push(p('方式二：运行安装目录下的 Uninstall 公司法务智慧管理系统.exe。'));
children.push(note('卸载仅移除程序文件，不会删除用户数据目录中的数据库与日志。如需彻底清除，请手动删除 %APPDATA%\\公司法务智慧管理系统 目录（删除前请务必备份 legal.db）。'));

/* ============ 四、功能使用说明 ============ */
children.push(h1('四、功能使用说明'));
children.push(p('本章按左侧导航菜单逐一介绍各功能模块。所有截图均取自 v1.0.1 实测环境，界面配色与布局在正式版中保持一致。'));

children.push(h2('4.1 登录界面'));
children.push(p('输入用户名与密码后点击「登录」。登录成功后凭据在本机保留 7 天，期间重新打开程序无需重复登录。'));
children.push(bullet('密码框右侧的「眼睛」图标可切换密码明文/密文显示。'));
children.push(bullet('连续多次输错密码会触发登录限流（15 分钟内最多 10 次），请稍后再试。'));

children.push(h2('4.2 仪表盘'));
children.push(p('登录后的默认首页，用于快速掌握整体经营情况。'));
children.push(bullet('顶部统计卡片：客户总数与活跃数、业务事项与进行中数量、待办任务与逾期数量、未收金额与开票总额。'));
children.push(bullet('次级指标：本月计时、文档数量、发票收款率与已收金额。'));
children.push(bullet('图表区：业务状态分布（饼图）、任务状态（柱状图）、发票金额统计（柱状图）。'));
children.push(bullet('列表区：逾期任务（含优先级与截止日期）、近期业务事项。'));
children.push(...figure('02-dashboard', '图 2  仪表盘（工作概览、统计图表与逾期提醒）'));

children.push(h2('4.3 客户管理'));
children.push(p('维护客户档案，是业务事项、发票、沟通记录等模块的基础数据。'));
children.push(bullet('支持企业客户与个人客户两种类型，可按名称 / 手机 / 邮箱 / 联系人搜索，按客户类型筛选。'));
children.push(bullet('点击「新建客户」录入名称、类型、联系人、电话、邮箱、地址、状态等；服务型客户可同时填写服务计划、月费与服务起止日期。'));
children.push(bullet('列表「业务数」列显示该客户名下的业务事项数量，可点击查看关联业务。'));
children.push(bullet('操作列提供编辑与删除；删除前系统会二次确认。'));
children.push(...figure('03-clients', '图 3  客户管理'));

children.push(h2('4.4 业务事项'));
children.push(p('记录并跟踪每一项法律事务，是系统的核心业务对象。'));
children.push(bullet('业务编号（MT-年份-序号）由系统自动生成，无需手工填写。'));
children.push(bullet('可按编号 / 标题搜索，按状态筛选：待处理、进行中、已完成等。'));
children.push(bullet('列表展示类型、客户、费用类型、优先级、状态、进度与截止日期，逾期或临近截止的业务会有醒目标识。'));
children.push(bullet('点击「新建业务」时，业务类型、标题、所属客户、费用类型为必填项。'));
children.push(...figure('04-matters', '图 4  业务事项'));

children.push(h2('4.5 任务管理'));
children.push(p('以看板形式管理团队待办，支持任务分派与进度跟踪。'));
children.push(bullet('看板分四列：待办、进行中、已完成、已取消，分别显示任务数量。'));
children.push(bullet('每张任务卡片展示标题、关联业务、优先级（低 / 中 / 高 / 紧急）、负责人与截止日期。'));
children.push(bullet('可对待办任务执行「完成」或「删除」操作；新建任务时可指定负责人与关联业务。'));
children.push(...figure('05-tasks', '图 5  任务管理（四列看板）'));

children.push(h2('4.6 计时收费'));
children.push(p('记录办案工时并自动折算费用，为发票开具提供依据。'));
children.push(bullet('点击「开始计时」选择业务即可开始计时，再次操作停止并自动生成本次计费记录；也支持手工补录工时。'));
children.push(bullet('顶部统计展示总计时、总金额、记录数与本月的计费金额。'));
children.push(bullet('列表按记录展示描述、业务、客户、开始时间、时长、金额，以及「是否计费」「是否已开票」状态。'));
children.push(bullet('计费金额 = 时长（小时）× 费率，费率来源于业务事项设置。'));
children.push(...figure('06-time-entries', '图 6  计时收费'));

children.push(h2('4.7 沟通记录'));
children.push(p('统一沉淀与客户的全部沟通痕迹。'));
children.push(bullet('支持微信、邮件、电话、面谈等渠道，并区分去电（发出）与来电（收到）方向。'));
children.push(bullet('记录内容包括发生时间、客户、渠道、方向、主题、联系人与沟通正文。'));
children.push(bullet('可按主题 / 内容 / 联系人搜索，按渠道筛选。'));
children.push(...figure('07-communications', '图 7  沟通记录'));

children.push(h2('4.8 发票管理'));
children.push(p('管理开票与收款，实时掌握应收账款。'));
children.push(bullet('顶部统计：发票数、开票总金额、已收金额、未收金额。'));
children.push(bullet('发票号由系统自动生成（INV-年份-序号），明细项支持多行录入，税额与总额自动计算。'));
children.push(bullet('支持多次分期收款：登记付款后自动累加已付金额，全额付清后状态自动变为「已支付」，部分付款为「部分支付」。'));
children.push(bullet('操作列提供付款登记、付款记录查询、编辑与删除；删除前会二次确认。'));
children.push(...figure('08-invoices', '图 8  发票管理'));

children.push(h2('4.9 合同管理'));
children.push(p('覆盖合同从起草到归档的完整生命周期。'));
children.push(bullet('合同编号自动生成（HT-年月日-序号）。'));
children.push(bullet('顶部标签页按状态分组：全部、草稿、审查中、待签订、已签订、执行中、已完成、已终止、已过期。'));
children.push(bullet('新建 / 编辑合同时可填写合同类型、金额、相对方、客户、起止时间等；详情页提供状态流转按钮与时间线。'));
children.push(bullet('状态流转：草稿 → 审查中 → 待签订 → 已签订 → 执行中 → 已完成（另含已终止 / 已过期）。'));
children.push(...figure('09-contracts', '图 9  合同管理'));

children.push(h2('4.10 文档管理'));
children.push(p('集中存放与业务相关的各类文件。'));
children.push(bullet('点击「上传文档」选择本地文件，填写名称、分类、所属客户与业务后保存。'));
children.push(bullet('列表展示文件名、原始名称、大小、类型、分类、所属客户与业务、上传时间。'));
children.push(bullet('支持关键字搜索与分类筛选，可下载或删除已上传的文件。'));
children.push(bullet('顶部显示文档总数与占用空间统计。'));
children.push(...figure('10-documents', '图 10  文档管理'));

children.push(h2('4.11 用户管理'));
children.push(p('管理系统账号及其角色。'));
children.push(bullet('可按用户名 / 姓名 / 邮箱搜索，按账号状态筛选。'));
children.push(bullet('新建用户需填写用户名、姓名、邮箱、初始密码并指定角色。'));
children.push(bullet('操作列提供「编辑」与「重置密码」；账号可停用但不会被删除，以保证历史数据归属完整。'));
children.push(...figure('11-users', '图 11  用户管理'));

children.push(h2('4.12 角色管理'));
children.push(p('配置角色及其权限范围，是用户权限控制的基础。'));
children.push(bullet('系统预置四种角色：ADMIN（系统管理员）、MANAGER（法务经理）、LAWYER（法务专员）、ASSISTANT（法务助理）。'));
children.push(bullet('每个角色由一组权限码构成，例如 client:read、matter:*、invoice:*、settings:*，* 表示全部权限。'));
children.push(bullet('列表展示角色名称、描述、权限标签、关联用户数与创建时间；可新增、编辑、查看用户或删除角色。'));
children.push(...figure('12-roles', '图 12  角色管理'));

children.push(h2('4.13 个人中心'));
children.push(p('展示当前登录账号的基本资料与权限范围，可在此核对姓名、角色与所拥有的权限码。'));
children.push(...figure('13-profile', '图 13  个人中心'));

/* ============ 五、部署与运维 ============ */
children.push(h1('五、部署与运维'));
children.push(h2('5.1 数据存储位置'));
children.push(p('程序安装目录为只读，所有运行期产生且需要写入的数据（数据库、日志）均存放于当前 Windows 用户的 AppData 目录：'));
children.push(new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [3610, 5416],
  rows: [
    row([cell('内容', 3610, { bold: true, fill: FILL_HEAD }), cell('路径', 5416, { bold: true, fill: FILL_HEAD })]),
    row([cell('业务数据库', 3610), cell('%APPDATA%\\公司法务智慧管理系统\\legal.db', 5416)]),
    row([cell('运行日志', 3610), cell('%APPDATA%\\公司法务智慧管理系统\\logs\\', 5416)]),
    row([cell('界面缓存', 3610), cell('%APPDATA%\\公司法务智慧管理系统\\Cache、Code Cache 等（可安全清理）', 5416)]),
    row([cell('程序文件', 3610), cell('C:\\Program Files\\legal-management-system\\', 5416)]),
  ]
}));
children.push(note('首次启动时，程序会把安装包内的初始数据库复制为 %APPDATA%\\公司法务智慧管理系统\\legal.db；此后所有业务数据都写入该文件。'));

children.push(h2('5.2 服务、端口与进程'));
children.push(bullet('主程序启动时会自动拉起后端服务，使用 Electron 内置的 Node.js 运行时，目标电脑无需安装 Node.js。'));
children.push(bullet('后端服务监听 3000 端口（仅本机访问），界面通过该端口读写数据。'));
children.push(bullet('关闭主窗口即退出程序，后端服务会随之自动停止，不会残留后台进程。'));
children.push(bullet('若需排查服务状态，可在浏览器访问 http://127.0.0.1:3000/health，返回 {"status":"ok"} 即表示服务正常。'));
children.push(note('若 3000 端口被其他程序占用，后端将启动失败，界面会表现为无数据。此时请先释放该端口或结束占用进程后重启程序。'));

children.push(h2('5.3 日志'));
children.push(p('程序运行日志写入 %APPDATA%\\公司法务智慧管理系统\\logs\\ 目录。遇到界面异常、后端启动失败等问题时，请优先查看该目录下最新日志文件。'));
children.push(p('此外，可通过「视图 → 开发者工具」（快捷键 F12）打开内置控制台，查看前端报错信息。'));

children.push(h2('5.4 数据备份与恢复'));
children.push(h3('备份'));
children.push(num('退出程序（关闭主窗口），确保数据库文件不再被占用。', 'numbers2'));
children.push(num('复制 %APPDATA%\\公司法务智慧管理系统\\legal.db 到安全位置。', 'numbers2'));
children.push(num('建议文件名带上日期，例如 legal_20260921.db，以便保留多个历史版本。', 'numbers2'));
children.push(h3('恢复'));
children.push(num('退出程序。', 'numbers3'));
children.push(num('用备份文件覆盖 %APPDATA%\\公司法务智慧管理系统\\legal.db。', 'numbers3'));
children.push(num('重新启动程序即可看到恢复后的数据。', 'numbers3'));
children.push(note('整个数据库仅一个文件，备份与迁移都只需复制该文件。请定期备份，并避免在程序运行中直接复制（可能得到不一致的快照）。'));

children.push(h2('5.5 迁移到新电脑'));
children.push(num('在新电脑上运行安装包完成安装。', 'numbers4'));
children.push(num('从旧电脑复制 %APPDATA%\\公司法务智慧管理系统\\legal.db。', 'numbers4'));
children.push(num('在新电脑上首次启动一次程序后再退出（用于生成用户数据目录），随后用旧数据库覆盖 legal.db。', 'numbers4'));
children.push(num('重新启动程序，数据即完成迁移，账号密码与旧机完全一致。', 'numbers4'));

children.push(h2('5.6 常用命令行操作'));
children.push(p('安装（静默）：'));
children.push(code('"公司法务智慧管理系统 Setup 1.0.1.exe" /S'));
children.push(p('卸载（静默）：'));
children.push(code('"C:\\Program Files\\legal-management-system\\Uninstall 公司法务智慧管理系统.exe" /S /allusers'));
children.push(p('健康检查：'));
children.push(code('curl http://127.0.0.1:3000/health'));

/* ============ 六、FAQ ============ */
children.push(h1('六、常见问题（FAQ）'));
children.push(new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [3000, 6026],
  rows: [
    row([cell('问题', 3000, { bold: true, fill: FILL_HEAD }), cell('解决办法', 6026, { bold: true, fill: FILL_HEAD })]),
    row([cell('双击图标没有反应', 3000), cell('等待 5～15 秒后端初始化；若仍无窗口，检查任务管理器中是否已有进程，或查看 logs 目录日志。杀毒软件拦截时请添加信任。', 6026)]),
    row([cell('登录后页面没有数据', 3000), cell('多为后端服务未启动或 3000 端口被占用。访问 http://127.0.0.1:3000/health 验证，释放端口后重启程序。', 6026)]),
    row([cell('忘记登录密码', 3000), cell('使用管理员账号登录，在「用户管理」中对该用户执行「重置密码」。', 6026)]),
    row([cell('界面白屏', 3000), cell('按 F12 查看控制台报错；常见原因为后端未就绪，稍候刷新（Ctrl+R）即可。', 6026)]),
    row([cell('为什么没有桌面快捷方式', 3000), cell('使用 /S 静默安装时不会创建桌面快捷方式，请使用图形化安装，或手动将程序发送到桌面。', 6026)]),
    row([cell('换电脑后数据怎么带走', 3000), cell('复制 %APPDATA%\\公司法务智慧管理系统\\legal.db 到新机同名目录即可，详见 5.5 节。', 6026)]),
    row([cell('卸载后数据会丢吗', 3000), cell('不会。卸载只删除程序文件，数据库仍保留在用户数据目录中。', 6026)]),
    row([cell('杀毒软件报毒', 3000), cell('Electron 打包程序常被误报，请在杀毒软件中将安装目录加入白名单。', 6026)]),
    row([cell('可以多人同时使用吗', 3000), cell('当前为单机版，数据存储在本机数据库；同一台电脑上可创建多个账号分别使用。', 6026)]),
    row([cell('能否修改后端端口', 3000), cell('端口在程序内固定为 3000，如需变更请联系技术支持重新构建，不建议用户自行修改。', 6026)]),
  ]
}));

/* ============ 七、附录 ============ */
children.push(h1('七、附录'));
children.push(h2('7.1 预置账号'));
children.push(new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [2400, 2200, 2200, 2226],
  rows: [
    row([cell('用户名', 2400, { bold: true, fill: FILL_HEAD }), cell('初始密码', 2200, { bold: true, fill: FILL_HEAD }), cell('姓名', 2200, { bold: true, fill: FILL_HEAD }), cell('角色', 2226, { bold: true, fill: FILL_HEAD })]),
    row([cell('admin', 2400), cell('123456', 2200), cell('张明', 2200), cell('系统管理员', 2226)]),
    row([cell('lawyer_zhang', 2400), cell('123456', 2200), cell('李律师', 2200), cell('法务专员', 2226)]),
    row([cell('assistant_wang', 2400), cell('123456', 2200), cell('王助理', 2200), cell('法务助理', 2226)]),
  ]
}));
children.push(note('以上为随包预置的演示数据。正式使用前请修改默认密码，并按实际需要新增账号。'));

children.push(h2('7.2 技术架构'));
children.push(new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [2400, 6626],
  rows: [
    row([cell('层级', 2400, { bold: true, fill: FILL_HEAD }), cell('技术选型', 6626, { bold: true, fill: FILL_HEAD })]),
    row([cell('桌面容器', 2400), cell('Electron 42.3.0（Chromium 148 + 内置 Node.js）', 6626)]),
    row([cell('前端', 2400), cell('React 19 + Vite 8 + Ant Design 6 + Zustand + Recharts + TypeScript', 6626)]),
    row([cell('后端', 2400), cell('Node.js + Express 4 + TypeScript 5 + Prisma 5.22', 6626)]),
    row([cell('数据库', 2400), cell('SQLite 嵌入式数据库（单文件 legal.db）', 6626)]),
    row([cell('认证', 2400), cell('JWT（有效期 7 天）+ bcrypt 密码加密 + 基于角色的权限校验', 6626)]),
    row([cell('打包', 2400), cell('electron-builder 26.8.1 / NSIS 安装包（Windows x64）', 6626)]),
  ]
}));

children.push(h2('7.3 快捷操作速查'));
children.push(new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [3000, 6026],
  rows: [
    row([cell('操作', 3000, { bold: true, fill: FILL_HEAD }), cell('快捷键 / 方式', 6026, { bold: true, fill: FILL_HEAD })]),
    row([cell('新建合同', 3000), cell('Ctrl + N', 6026)]),
    row([cell('刷新界面', 3000), cell('Ctrl + R', 6026)]),
    row([cell('强制刷新', 3000), cell('Ctrl + Shift + R', 6026)]),
    row([cell('全屏切换', 3000), cell('F11', 6026)]),
    row([cell('开发者工具', 3000), cell('F12', 6026)]),
    row([cell('退出程序', 3000), cell('Ctrl + Q（关闭主窗口同样退出）', 6026)]),
    row([cell('显示主窗口', 3000), cell('双击系统托盘图标，或右键托盘图标选择「显示主窗口」', 6026)]),
    row([cell('重启后端服务', 3000), cell('右键系统托盘图标 → 重启后端服务', 6026)]),
    row([cell('查看版本', 3000), cell('菜单「帮助 → 关于」', 6026)]),
  ]
}));

children.push(new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: '— 文档结束 —', size: 20, color: '808080' })] }));

/* ---------------- 生成 ---------------- */
const doc = new Document({
  styles: {
    default: { document: { run: { font: "SimSun", size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, font: "SimHei", color: "1F4E79" },
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
          style: { paragraph: { indent: { left: 620, hanging: 310 } } } }] },
      ...[1, 2, 3, 4].map((n) => ({
        reference: "numbers" + n,
        levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 620, hanging: 310 } } } }]
      })),
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
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
        new TextRun({ text: "公司法务智慧管理系统 · 安装部署与使用说明书", size: 16, color: "808080" })
      ] })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "第 ", size: 18 }),
        new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
        new TextRun({ text: " 页 / 共 ", size: 18 }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
        new TextRun({ text: " 页", size: 18 })
      ] })] })
    },
    children
  }]
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUT, buffer);
  console.log('DOCX 已生成:', OUT, '大小', Math.round(buffer.length / 1024) + 'KB');
});
