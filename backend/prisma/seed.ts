// 公司法务智慧管理系统 - 种子数据脚本
// 功能: 初始化角色、权限、用户、合同模板等基础数据

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 角色权限配置
const rolePermissions = {
  admin: {
    contracts: ['read', 'write', 'approve', 'delete'],
    cases: ['read', 'write'],
    agents: ['read', 'write'],
    knowledge: ['read', 'write'],
    users: ['read', 'write'],
    system: ['admin']
  },
  legal_manager: {
    contracts: ['read', 'write', 'approve'],
    cases: ['read', 'write'],
    agents: ['read', 'write'],
    knowledge: ['read', 'write'],
    users: ['read'],
    system: []
  },
  legal_staff: {
    contracts: ['read', 'write'],
    cases: ['read', 'write'],
    agents: ['read'],
    knowledge: ['read', 'write'],
    users: [],
    system: []
  },
  user: {
    contracts: ['read'],
    cases: ['read'],
    agents: [],
    knowledge: ['read'],
    users: [],
    system: []
  }
};

// 合同模板数据
const contractTemplates = [
  {
    name: '买卖合同模板',
    description: '适用于货物买卖、商品交易等场景的标准合同模板',
    content: `# 买卖合同

**合同编号**: _______________
**签订日期**: _______________

## 第一条 标的物
甲方（卖方）向乙方（买方）出售以下货物：
1. 货物名称：_______________
2. 规格型号：_______________
3. 数量：_______________
4. 单价：_______________

## 第二条 质量标准
货物质量应符合国家标准/行业标准/双方约定标准。

## 第三条 交付方式
1. 交付时间：_______________
2. 交付地点：_______________
3. 运输方式及费用：_______________

## 第四条 付款方式
1. 合同总金额：_______________
2. 付款方式：一次性付款/分期付款
3. 付款时间：_______________

## 第五条 违约责任
任何一方违反本合同约定的，应向守约方支付合同总价____%的违约金。

## 第六条 争议解决
本合同在履行过程中发生争议，双方应协商解决；协商不成的，提交仲裁委员会仲裁。

**甲方（盖章）**: _______________  **乙方（盖章）**: _______________
**代表人**: _______________        **代表人**: _______________
**日期**: _______________          **日期**: _______________`
  },
  {
    name: '服务合同模板',
    description: '适用于各类专业服务、咨询、技术支持等服务性合同',
    content: `# 服务合同

**合同编号**: _______________
**签订日期**: _______________

## 第一条 服务内容
乙方为甲方提供以下服务：
1. 服务项目：_______________
2. 服务范围：_______________
3. 服务标准：_______________

## 第二条 服务期限
1. 服务起始日期：_______________
2. 服务结束日期：_______________
3. 服务地点：_______________

## 第三条 服务费用
1. 服务费用总额：_______________
2. 支付方式：_______________
3. 支付时间：_______________

## 第四条 双方权利义务
### 甲方权利义务：
1. 提供必要的工作条件和协助；
2. 按时支付服务费用；
3. 配合乙方完成服务项目。

### 乙方权利义务：
1. 按约定标准提供服务；
2. 保守甲方商业秘密；
3. 提供合格的服务人员。

## 第五条 违约责任
任何一方违反本合同约定的，应向守约方支付服务费用____%的违约金。

## 第六条 争议解决
本合同在履行过程中发生争议，双方应协商解决；协商不成的，向人民法院提起诉讼。

**甲方（盖章）**: _______________  **乙方（盖章）**: _______________
**代表人**: _______________        **代表人**: _______________
**日期**: _______________          **日期**: _______________`
  },
  {
    name: '劳动合同模板',
    description: '适用于企业员工招聘、劳动用工等人力资源合同',
    content: `# 劳动合同

**合同编号**: _______________
**签订日期**: _______________

## 第一条 合同双方
**用人单位（甲方）**：
名称：_______________
法定代表人：_______________
地址：_______________

**劳动者（乙方）**：
姓名：_______________
身份证号：_______________
住址：_______________

## 第二条 合同期限
1. 合同类型：固定期限/无固定期限
2. 起始日期：_______________
3. 结束日期：_______________

## 第三条 工作内容
1. 工作岗位：_______________
2. 工作地点：_______________
3. 工作职责：_______________

## 第四条 工作时间和休息休假
1. 工作时间：标准工时制/不定时工时制/综合计算工时制
2. 每周工作不超过40小时
3. 依法享受法定节假日、年休假等假期

## 第五条 劳动报酬
1. 工资标准：_______________元/月
2. 发放日期：每月____日前
3. 支付方式：银行转账

## 第六条 社会保险
甲方依法为乙方缴纳养老保险、医疗保险、失业保险、工伤保险、生育保险等社会保险。

## 第七条 劳动保护
甲方应为乙方提供必要的劳动保护条件和劳动防护用品。

## 第八条 合同解除
1. 双方协商一致可以解除本合同；
2. 乙方提前30日书面通知甲方可以解除本合同；
3. 甲方有下列情形之一的，乙方可以解除劳动合同：未按约定支付劳动报酬、未缴纳社会保险费等。

## 第九条 违约责任
任何一方违反本合同约定的，应按照《劳动合同法》等相关法律法规承担违约责任。

## 第十条 争议解决
因履行本合同发生争议，双方应协商解决；协商不成的，可以向劳动争议仲裁委员会申请仲裁。

**甲方（盖章）**: _______________  **乙方（签字）**: _______________
**法定代表人**: _______________    **日期**: _______________
**日期**: _______________`
  }
];

async function main() {
  console.log('🌱 开始执行种子数据脚本...\n');

  // 1. 创建角色
  console.log('📋 创建角色...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { roleName: 'admin' },
      update: {
        description: '超级管理员，拥有系统所有权限',
        permissions: rolePermissions.admin
      },
      create: {
        roleName: 'admin',
        description: '超级管理员，拥有系统所有权限',
        permissions: rolePermissions.admin
      }
    }),
    prisma.role.upsert({
      where: { roleName: 'legal_manager' },
      update: {
        description: '法务主管，负责合同审批、案件管理',
        permissions: rolePermissions.legal_manager
      },
      create: {
        roleName: 'legal_manager',
        description: '法务主管，负责合同审批、案件管理',
        permissions: rolePermissions.legal_manager
      }
    }),
    prisma.role.upsert({
      where: { roleName: 'legal_staff' },
      update: {
        description: '法务专员，负责合同起草、案件跟进',
        permissions: rolePermissions.legal_staff
      },
      create: {
        roleName: 'legal_staff',
        description: '法务专员，负责合同起草、案件跟进',
        permissions: rolePermissions.legal_staff
      }
    }),
    prisma.role.upsert({
      where: { roleName: 'user' },
      update: {
        description: '普通用户，仅有查看权限',
        permissions: rolePermissions.user
      },
      create: {
        roleName: 'user',
        description: '普通用户，仅有查看权限',
        permissions: rolePermissions.user
      }
    })
  ]);

  console.log(`✅ 创建了 ${roles.length} 个角色\n`);

  // 2. 创建用户
  console.log('👤 创建用户...');
  const passwordHash1 = await bcrypt.hash('admin123', 10);
  const passwordHash2 = await bcrypt.hash('123456', 10);
  const passwordHash3 = await bcrypt.hash('123456', 10);

  const users = await Promise.all([
    // 超级管理员
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        realName: '系统管理员',
        email: 'admin@company.com',
        passwordHash: passwordHash1,
        roleId: roles[0].id,
        status: 'ACTIVE'
      },
      create: {
        username: 'admin',
        passwordHash: passwordHash1,
        realName: '系统管理员',
        email: 'admin@company.com',
        roleId: roles[0].id,
        status: 'ACTIVE'
      }
    }),
    // 法务主管
    prisma.user.upsert({
      where: { username: 'zhangsan' },
      update: {
        realName: '张三',
        email: 'zhangsan@company.com',
        passwordHash: passwordHash2,
        roleId: roles[1].id,
        department: '法务部',
        status: 'ACTIVE'
      },
      create: {
        username: 'zhangsan',
        passwordHash: passwordHash2,
        realName: '张三',
        email: 'zhangsan@company.com',
        roleId: roles[1].id,
        department: '法务部',
        status: 'ACTIVE'
      }
    }),
    // 法务专员
    prisma.user.upsert({
      where: { username: 'lisi' },
      update: {
        realName: '李四',
        email: 'lisi@company.com',
        passwordHash: passwordHash3,
        roleId: roles[2].id,
        department: '法务部',
        status: 'ACTIVE'
      },
      create: {
        username: 'lisi',
        passwordHash: passwordHash3,
        realName: '李四',
        email: 'lisi@company.com',
        roleId: roles[2].id,
        department: '法务部',
        status: 'ACTIVE'
      }
    })
  ]);

  console.log(`✅ 创建了 ${users.length} 个用户`);
  console.log('   - admin / admin123 (超级管理员)');
  console.log('   - zhangsan / 123456 (法务主管)');
  console.log('   - lisi / 123456 (法务专员)\n');

  // 3. 创建合同模板（使用知识库存储）
  console.log('📄 创建合同模板...');
  
  // 先创建一个系统知识库用于存储模板
  const systemKB = await prisma.knowledgeBase.upsert({
    where: { id: 1 },
    update: {
      name: '合同模板库',
      description: '系统内置的合同模板集合',
      kbType: 'PUBLIC',
      ownerId: users[0].id,
      isPublished: true
    },
    create: {
      name: '合同模板库',
      description: '系统内置的合同模板集合',
      kbType: 'PUBLIC',
      ownerId: users[0].id,
      isPublished: true
    }
  });

  // 创建模板文档
  let templateCount = 0;
  for (const template of contractTemplates) {
    const existing = await prisma.document.findFirst({
      where: {
        kbId: systemKB.id,
        title: template.name
      }
    });

    if (existing) {
      await prisma.document.update({
        where: { id: existing.id },
        data: {
          content: template.content,
          status: 'PROCESSED'
        }
      });
    } else {
      await prisma.document.create({
        data: {
          kbId: systemKB.id,
          title: template.name,
          content: template.content,
          fileType: 'md',
          status: 'PROCESSED',
          uploadedById: users[0].id
        }
      });
    }
    templateCount++;
  }

  console.log(`✅ 创建了 ${templateCount} 个合同模板`);
  console.log('   - 买卖合同模板');
  console.log('   - 服务合同模板');
  console.log('   - 劳动合同模板\n');

  // 4. 创建示例服务产品
  console.log('📦 创建服务产品...');
  const products = await Promise.all([
    prisma.serviceProduct.upsert({
      where: { id: 1 },
      update: {
        name: '合同审查服务',
        description: '专业律师对合同进行全面审查，识别风险条款',
        price: 500,
        pricingUnit: 'PER_CASE',
        category: '合同服务',
        isPublished: true
      },
      create: {
        name: '合同审查服务',
        description: '专业律师对合同进行全面审查，识别风险条款',
        price: 500,
        pricingUnit: 'PER_CASE',
        category: '合同服务',
        isPublished: true
      }
    }),
    prisma.serviceProduct.upsert({
      where: { id: 2 },
      update: {
        name: '法律咨询服务',
        description: '一对一专业法律咨询，解答法律疑问',
        price: 300,
        pricingUnit: 'PER_HOUR',
        category: '咨询服务',
        isPublished: true
      },
      create: {
        name: '法律咨询服务',
        description: '一对一专业法律咨询，解答法律疑问',
        price: 300,
        pricingUnit: 'PER_HOUR',
        category: '咨询服务',
        isPublished: true
      }
    }),
    prisma.serviceProduct.upsert({
      where: { id: 3 },
      update: {
        name: '企业法律顾问',
        description: '年度企业法律顾问服务，全程法律支持',
        price: 30000,
        pricingUnit: 'PER_MONTH',
        category: '顾问服务',
        isPublished: true
      },
      create: {
        name: '企业法律顾问',
        description: '年度企业法律顾问服务，全程法律支持',
        price: 30000,
        pricingUnit: 'PER_MONTH',
        category: '顾问服务',
        isPublished: true
      }
    })
  ]);

  console.log(`✅ 创建了 ${products.length} 个服务产品\n`);

  console.log('🎉 种子数据执行完成！\n');
  console.log('============================================');
  console.log('账号信息：');
  console.log('--------------------------------------------');
  console.log('用户名: admin      密码: admin123  角色: 超级管理员');
  console.log('用户名: zhangsan   密码: 123456    角色: 法务主管');
  console.log('用户名: lisi       密码: 123456    角色: 法务专员');
  console.log('============================================\n');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
