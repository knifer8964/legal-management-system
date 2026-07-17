import { PrismaClient, ClientType, ClientStatus, MatterType, MatterStatus, FeeType, Priority, TaskStatus, InvoiceStatus, CommChannel, Direction, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始 Seed 数据...');

  // ============================================
  // 1. 角色
  // ============================================
  console.log('📋 创建角色...');
  
  const adminRole = await prisma.role.create({
    data: {
      roleName: 'ADMIN',
      description: '系统管理员',
      permissions: ['*'],
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      roleName: 'MANAGER',
      description: '法务经理',
      permissions: ['client:*', 'matter:*', 'invoice:*', 'report:*', 'settings:*'],
    },
  });

  const lawyerRole = await prisma.role.create({
    data: {
      roleName: 'LAWYER',
      description: '法务专员',
      permissions: ['client:read', 'matter:*', 'document:*', 'time:write'],
    },
  });

  const assistantRole = await prisma.role.create({
    data: {
      roleName: 'ASSISTANT',
      description: '法务助理',
      permissions: ['client:read', 'matter:read', 'task:*'],
    },
  });

  console.log('✅ 4 个角色创建完成');

  // ============================================
  // 2. 用户
  // ============================================
  console.log('👤 创建用户...');

  // 密码都是: 123456 (bcrypt hash)
  const passwordHash = '$2b$10$XRYxkzw47kdFzaypdidlbePWLkOLsN8UwnSJUwmNesK2cZXZkkOXG';

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash,
      realName: '张明',
      email: 'admin@studio.local',
      phone: '13800138000',
      roleId: adminRole.id,
      department: '管理部',
      status: UserStatus.ACTIVE,
    },
  });

  const lawyerUser = await prisma.user.create({
    data: {
      username: 'lawyer_zhang',
      passwordHash,
      realName: '李律师',
      email: 'lawyer@studio.local',
      phone: '13900139000',
      roleId: lawyerRole.id,
      department: '法务部',
      status: UserStatus.ACTIVE,
    },
  });

  const assistantUser = await prisma.user.create({
    data: {
      username: 'assistant_wang',
      passwordHash,
      realName: '王助理',
      email: 'assistant@studio.local',
      phone: '13700137000',
      roleId: assistantRole.id,
      department: '行政部',
      status: UserStatus.ACTIVE,
    },
  });

  console.log('✅ 3 个用户创建完成');

  // ============================================
  // 3. 个人客户
  // ============================================
  console.log('🏠 创建客户...');

  const personalClient1 = await prisma.client.create({
    data: {
      clientType: ClientType.PERSONAL,
      name: '王小明',
      phone: '15012340001',
      email: 'wangxiaoming@email.com',
      gender: 'MALE',
      idNumber: '110101199001011234',
      address: '北京市朝阳区某小区',
      tags: ['VIP', '老客户'],
      source: '朋友推荐',
      status: ClientStatus.ACTIVE,
    },
  });

  const personalClient2 = await prisma.client.create({
    data: {
      clientType: ClientType.PERSONAL,
      name: '李女士',
      phone: '15012340002',
      email: 'lilishi@email.com',
      gender: 'FEMALE',
      address: '上海市浦东新区',
      tags: ['新客户'],
      source: '网络咨询',
      status: ClientStatus.ACTIVE,
    },
  });

  const enterpriseClient1 = await prisma.client.create({
    data: {
      clientType: ClientType.ENTERPRISE,
      name: '北京创新科技有限公司',
      shortName: '创新科技',
      phone: '010-12345678',
      email: 'contact@cxkj.com',
      creditCode: '91110108MA01XXXXX',
      legalRep: '陈总',
      industry: '科技',
      scale: '中型',
      website: 'https://www.cxkj.com',
      contactName: '张经理',
      contactTitle: '行政总监',
      contactPhone: '13812345678',
      contactEmail: 'zhangji@cxkj.com',
      contactWechat: 'zhangji_cxkj',
      servicePlan: 'PREMIUM',
      monthlyFee: 5000,
      serviceStart: new Date('2026-01-01'),
      serviceEnd: new Date('2027-01-01'),
      tags: ['企业客户', '长期合作', '虚拟法务部'],
      source: '商务拓展',
      status: ClientStatus.ACTIVE,
    },
  });

  const enterpriseClient2 = await prisma.client.create({
    data: {
      clientType: ClientType.ENTERPRISE,
      name: '上海智远贸易有限公司',
      shortName: '智远贸易',
      phone: '021-87654321',
      email: 'info@zhiyuan.cn',
      creditCode: '91310115MA1HXXXXX',
      legalRep: '刘董',
      industry: '贸易',
      scale: '小型',
      contactName: '周小姐',
      contactTitle: '人事主管',
      contactPhone: '13998765432',
      contactWechat: 'zhouxiaojie_zy',
      servicePlan: 'STANDARD',
      monthlyFee: 3000,
      serviceStart: new Date('2026-04-01'),
      serviceEnd: new Date('2027-04-01'),
      tags: ['企业客户', '虚拟法务部'],
      source: '行业推荐',
      status: ClientStatus.ACTIVE,
    },
  });

  const potentialClient = await prisma.client.create({
    data: {
      clientType: ClientType.ENTERPRISE,
      name: '深圳鹏程物流有限公司',
      shortName: '鹏程物流',
      phone: '0755-12345678',
      email: 'info@pcwl.com',
      creditCode: '91440300MA5DPXXXX',
      legalRep: '王总',
      industry: '物流',
      scale: '中型',
      tags: ['潜在客户'],
      source: '展会名片',
      status: ClientStatus.POTENTIAL,
    },
  });

  console.log('✅ 5 个客户创建完成');

  // ============================================
  // 4. 业务事项 (Matter)
  // ============================================
  console.log('📁 创建业务事项...');

  // 合同审查 - 王小明
  const contractReview1 = await prisma.matter.create({
    data: {
      matterNo: 'MT-2026-001',
      matterType: MatterType.CONTRACT_REVIEW,
      title: '房屋租赁合同审查',
      description: '审查房东提供的租赁合同，识别风险条款',
      clientId: personalClient1.id,
      status: MatterStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      feeType: FeeType.FIXED,
      feeAmount: 2000,
      totalAmount: 2000,
      paidAmount: 1000,
      startDate: new Date('2026-07-01'),
      deadline: new Date('2026-07-10'),
      progress: 60,
      nextAction: '整理风险清单并与客户沟通',
      assigneeId: lawyerUser.id,
      createdById: lawyerUser.id,
    },
  });

  // 诉讼案件 - 创新科技
  const litigationCase = await prisma.matter.create({
    data: {
      matterNo: 'MT-2026-002',
      matterType: MatterType.CASE_LITIGATION,
      title: '供应商合同纠纷诉讼',
      description: '某供应商拖欠货款，需提起诉讼追讨',
      clientId: enterpriseClient1.id,
      status: MatterStatus.IN_PROGRESS,
      priority: Priority.URGENT,
      feeType: FeeType.CONTINGENCY,
      feeAmount: 50000,
      totalAmount: 150000,
      paidAmount: 0,
      startDate: new Date('2026-06-15'),
      deadline: new Date('2026-08-31'),
      progress: 30,
      nextAction: '准备起诉材料，7月20日前提交',
      assigneeId: lawyerUser.id,
      createdById: lawyerUser.id,
      metadata: {
        court: '北京市朝阳区人民法院',
        caseNumber: '2026朝法民初12345号',
        defendant: '深圳市某科技有限公司',
        claimAmount: 500000,
      },
    },
  });

  // 法律咨询 - 李女士
  const consultation = await prisma.matter.create({
    data: {
      matterNo: 'MT-2026-003',
      matterType: MatterType.CONSULTATION,
      title: '婚姻财产法律咨询',
      description: '离婚案件财产分割咨询',
      clientId: personalClient2.id,
      status: MatterStatus.COMPLETED,
      priority: Priority.MEDIUM,
      feeType: FeeType.HOURLY,
      feeAmount: 500,
      hourlyRate: 500,
      totalAmount: 1500,
      paidAmount: 1500,
      startDate: new Date('2026-07-05'),
      completedAt: new Date('2026-07-05'),
      progress: 100,
      assigneeId: lawyerUser.id,
      createdById: lawyerUser.id,
    },
  });

  // 合规顾问 - 智远贸易
  const complianceMatter = await prisma.matter.create({
    data: {
      matterNo: 'MT-2026-004',
      matterType: MatterType.COMPLIANCE,
      title: '劳动合规体系建设',
      description: '协助企业完善劳动人事规章制度',
      clientId: enterpriseClient2.id,
      status: MatterStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      feeType: FeeType.MONTHLY,
      feeAmount: 3000,
      totalAmount: 9000,
      paidAmount: 3000,
      startDate: new Date('2026-04-01'),
      deadline: new Date('2026-07-01'),
      progress: 80,
      nextAction: '完成最终审核，提交制度文件',
      assigneeId: lawyerUser.id,
      createdById: lawyerUser.id,
    },
  });

  // 合同起草 - 创新科技
  const contractDraft = await prisma.matter.create({
    data: {
      matterNo: 'MT-2026-005',
      matterType: MatterType.CONTRACT_DRAFT,
      title: '技术秘密保护协议起草',
      description: '为技术部门起草保密协议和竞业限制协议',
      clientId: enterpriseClient1.id,
      status: MatterStatus.PENDING,
      priority: Priority.MEDIUM,
      feeType: FeeType.FIXED,
      feeAmount: 3000,
      totalAmount: 3000,
      paidAmount: 0,
      startDate: new Date('2026-07-20'),
      deadline: new Date('2026-07-31'),
      progress: 0,
      nextAction: '等待客户提供技术部门人员名单',
      assigneeId: lawyerUser.id,
      createdById: lawyerUser.id,
    },
  });

  console.log('✅ 5 个业务事项创建完成');

  // ============================================
  // 5. 任务清单
  // ============================================
  console.log('✅ 创建任务...');

  await prisma.task.createMany({
    data: [
      {
        matterId: contractReview1.id,
        userId: lawyerUser.id,
        title: '完成合同风险清单整理',
        description: '列出所有需要修改的条款',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        dueDate: new Date('2026-07-08'),
      },
      {
        matterId: contractReview1.id,
        userId: assistantUser.id,
        title: '收集类似判例',
        description: '查找类似租赁纠纷案例供参考',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        dueDate: new Date('2026-07-09'),
      },
      {
        matterId: litigationCase.id,
        userId: lawyerUser.id,
        title: '起草民事起诉状',
        description: '按照法院模板起草起诉状',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.URGENT,
        dueDate: new Date('2026-07-18'),
      },
      {
        matterId: litigationCase.id,
        userId: assistantUser.id,
        title: '整理证据材料清单',
        description: '收集合同、送货单、对账单等',
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        dueDate: new Date('2026-07-15'),
        completedAt: new Date('2026-07-14'),
      },
      {
        userId: lawyerUser.id,
        title: '回复李女士咨询邮件',
        description: '关于离婚财产分割的补充问题',
        status: TaskStatus.DONE,
        priority: Priority.MEDIUM,
        dueDate: new Date('2026-07-06'),
        completedAt: new Date('2026-07-05'),
      },
    ],
  });

  console.log('✅ 5 个任务创建完成');

  // ============================================
  // 6. 时间记录
  // ============================================
  console.log('⏱️ 创建时间记录...');

  await prisma.timeEntry.createMany({
    data: [
      {
        matterId: contractReview1.id,
        userId: lawyerUser.id,
        clientId: personalClient1.id,
        description: '初次沟通，了解合同情况',
        startTime: new Date('2026-07-01 10:00'),
        endTime: new Date('2026-07-01 11:30'),
        duration: 90,
        hourlyRate: 500,
        amount: 750,
        isBillable: true,
        isBilled: true,
      },
      {
        matterId: contractReview1.id,
        userId: lawyerUser.id,
        clientId: personalClient1.id,
        description: '合同条款逐条审查',
        startTime: new Date('2026-07-02 14:00'),
        endTime: new Date('2026-07-02 17:00'),
        duration: 180,
        hourlyRate: 500,
        amount: 1500,
        isBillable: true,
        isBilled: false,
      },
      {
        matterId: litigationCase.id,
        userId: lawyerUser.id,
        clientId: enterpriseClient1.id,
        description: '案件分析，制定诉讼策略',
        startTime: new Date('2026-07-10 09:00'),
        endTime: new Date('2026-07-10 12:00'),
        duration: 180,
        hourlyRate: 800,
        amount: 2400,
        isBillable: true,
        isBilled: false,
      },
      {
        matterId: consultation.id,
        userId: lawyerUser.id,
        clientId: personalClient2.id,
        description: '婚姻法咨询（3小时）',
        startTime: new Date('2026-07-05 10:00'),
        endTime: new Date('2026-07-05 13:00'),
        duration: 180,
        hourlyRate: 500,
        amount: 1500,
        isBillable: true,
        isBilled: true,
      },
    ],
  });

  console.log('✅ 4 条时间记录创建完成');

  // ============================================
  // 7. 发票
  // ============================================
  console.log('💰 创建发票...');

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-2026-001',
      clientId: personalClient1.id,
      matterId: contractReview1.id,
      createdById: lawyerUser.id,
      subtotal: 2000,
      taxRate: 6,
      taxAmount: 120,
      totalAmount: 2120,
      paidAmount: 1000,
      status: InvoiceStatus.PARTIAL,
      issueDate: new Date('2026-07-03'),
      dueDate: new Date('2026-07-31'),
      items: JSON.stringify([
        { name: '房屋租赁合同审查', quantity: 1, unitPrice: 2000, amount: 2000 },
      ]),
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-2026-002',
      clientId: enterpriseClient2.id,
      matterId: complianceMatter.id,
      createdById: lawyerUser.id,
      subtotal: 3000,
      taxRate: 6,
      taxAmount: 180,
      totalAmount: 3180,
      paidAmount: 3180,
      status: InvoiceStatus.PAID,
      issueDate: new Date('2026-04-01'),
      dueDate: new Date('2026-04-15'),
      paidAt: new Date('2026-04-10'),
      items: JSON.stringify([
        { name: '4月合规顾问服务费', quantity: 1, unitPrice: 3000, amount: 3000 },
      ]),
    },
  });

  console.log('✅ 2 张发票创建完成');

  // ============================================
  // 8. 沟通记录
  // ============================================
  console.log('💬 创建沟通记录...');

  await prisma.communication.createMany({
    data: [
      {
        clientId: personalClient1.id,
        matterId: contractReview1.id,
        userId: lawyerUser.id,
        channel: CommChannel.PHONE,
        direction: Direction.INBOUND,
        content: '客户来电咨询合同问题，约定了面谈时间',
        contactName: '王小明',
        contactInfo: '15012340001',
        sentAt: new Date('2026-06-28 15:30'),
        readAt: new Date('2026-06-28 15:35'),
      },
      {
        clientId: personalClient1.id,
        matterId: contractReview1.id,
        userId: lawyerUser.id,
        channel: CommChannel.MEETING,
        direction: Direction.INBOUND,
        content: '当面沟通，详细了解租赁房屋情况、房东信息、特殊需求等',
        contactName: '王小明',
        contactInfo: '北京市朝阳区某咖啡厅',
        sentAt: new Date('2026-07-01 10:00'),
        readAt: new Date('2026-07-01 10:00'),
      },
      {
        clientId: enterpriseClient1.id,
        matterId: litigationCase.id,
        userId: lawyerUser.id,
        channel: CommChannel.EMAIL,
        direction: Direction.OUTBOUND,
        subject: '诉讼材料准备清单',
        content: '请贵司准备以下材料：1.采购合同原件...',
        contactName: '张经理',
        contactInfo: 'zhangji@cxkj.com',
        fromAddr: 'lawyer@studio.local',
        toAddrs: JSON.stringify(['zhangji@cxkj.com']),
        sentAt: new Date('2026-07-10 16:00'),
        readAt: new Date('2026-07-11 09:30'),
      },
      {
        clientId: enterpriseClient2.id,
        matterId: complianceMatter.id,
        userId: lawyerUser.id,
        channel: CommChannel.WECHAT,
        direction: Direction.OUTBOUND,
        content: '劳动制度初稿已发至您的邮箱，请查收',
        contactName: '周小姐',
        contactWechat: 'zhouxiaojie_zy',
        sentAt: new Date('2026-07-12 11:20'),
        readAt: new Date('2026-07-12 14:00'),
      },
    ],
  });

  console.log('✅ 4 条沟通记录创建完成');

  // ============================================
  // 9. 企业配置 (虚拟法务部)
  // ============================================
  console.log('🏢 创建企业配置...');

  await prisma.enterpriseConfig.create({
    data: {
      clientId: enterpriseClient1.id,
      serviceLevel: 'PREMIUM',
      responseTime: 4, // 4小时内响应
      monthlyQuota: 20,
      usedQuota: 8,
      oaWebhookUrl: 'https://oa.cxkj.com/webhook/legal',
      portalTitle: '创新科技法务部',
      portalTheme: 'blue',
      members: JSON.stringify([
        { name: '张经理', phone: '13812345678', email: 'zhangji@cxkj.com', role: '接口人', department: '行政部' },
        { name: '李主管', phone: '13812345679', email: 'liguanli@cxkj.com', role: '法务对接', department: '法务部' },
      ]),
    },
  });

  await prisma.enterpriseConfig.create({
    data: {
      clientId: enterpriseClient2.id,
      serviceLevel: 'STANDARD',
      responseTime: 8,
      monthlyQuota: 10,
      usedQuota: 5,
      portalTitle: '智远贸易法务部',
      portalTheme: 'green',
    },
  });

  console.log('✅ 2 个企业配置创建完成');

  // ============================================
  // 10. 时间线事件
  // ============================================
  console.log('📝 创建时间线事件...');

  await prisma.timelineEvent.createMany({
    data: [
      {
        matterId: contractReview1.id,
        eventType: 'STATUS_CHANGE',
        title: '新建业务事项',
        fromStatus: null,
        toStatus: 'PENDING',
        operatorId: lawyerUser.id,
        createdAt: new Date('2026-07-01 09:00'),
      },
      {
        matterId: contractReview1.id,
        eventType: 'NOTE',
        title: '客户提供了合同原件',
        description: '收到客户发来的PDF合同文件',
        operatorId: assistantUser.id,
        createdAt: new Date('2026-07-01 09:30'),
      },
      {
        matterId: contractReview1.id,
        eventType: 'STATUS_CHANGE',
        title: '开始处理',
        fromStatus: 'PENDING',
        toStatus: 'IN_PROGRESS',
        operatorId: lawyerUser.id,
        createdAt: new Date('2026-07-01 10:00'),
      },
      {
        matterId: litigationCase.id,
        eventType: 'STATUS_CHANGE',
        title: '新建案件',
        fromStatus: null,
        toStatus: 'PENDING',
        operatorId: lawyerUser.id,
        createdAt: new Date('2026-06-15 14:00'),
      },
      {
        matterId: litigationCase.id,
        eventType: 'NOTE',
        title: '收集到关键证据',
        description: '获取到供应商签字的送货单',
        operatorId: assistantUser.id,
        createdAt: new Date('2026-07-14 16:00'),
      },
    ],
  });

  console.log('✅ 5 条时间线事件创建完成');

  // ============================================
  // 11. 系统日志
  // ============================================
  console.log('📊 创建系统日志...');

  await prisma.systemLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'LOGIN',
        resource: 'SYSTEM',
        method: 'POST',
        path: '/api/v1/auth/login',
        ip: '127.0.0.1',
        status: 'SUCCESS',
      },
      {
        userId: lawyerUser.id,
        action: 'CREATE',
        resource: 'Matter',
        resourceId: contractReview1.id,
        method: 'POST',
        path: '/api/v1/matters',
        ip: '127.0.0.1',
        status: 'SUCCESS',
      },
      {
        userId: lawyerUser.id,
        action: 'CREATE',
        resource: 'Matter',
        resourceId: litigationCase.id,
        method: 'POST',
        path: '/api/v1/matters',
        ip: '127.0.0.1',
        status: 'SUCCESS',
      },
    ],
  });

  console.log('✅ 3 条系统日志创建完成');

  // ============================================
  // 完成
  // ============================================
  console.log('\n🎉 Seed 数据创建完成！\n');
  console.log('='.repeat(50));
  console.log('📊 数据统计:');
  console.log(`  - 角色: 4 个`);
  console.log(`  - 用户: 3 个 (admin/lawyer_zhang/assistant_wang)`);
  console.log(`  - 客户: 5 个 (2个人 + 3企业)`);
  console.log(`  - 业务事项: 5 个`);
  console.log(`  - 任务: 5 个`);
  console.log(`  - 时间记录: 4 条`);
  console.log(`  - 发票: 2 张`);
  console.log(`  - 沟通记录: 4 条`);
  console.log(`  - 企业配置: 2 个`);
  console.log(`  - 时间线事件: 5 条`);
  console.log(`  - 系统日志: 3 条`);
  console.log('='.repeat(50));
  console.log('\n🔑 测试账号:');
  console.log('  admin / 123456 (管理员)');
  console.log('  lawyer_zhang / 123456 (法务专员)');
  console.log('  assistant_wang / 123456 (法务助理)');
}

main()
  .catch((e) => {
    console.error('❌ Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
