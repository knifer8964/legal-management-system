import React, { useEffect, useState } from 'react';
import {
  Table, Card, Button, Input, Space, Tag, Drawer, Form,
  Row, Col, message, Popconfirm, Typography, Descriptions,
  Select, DatePicker, InputNumber, Tabs, Steps, Empty,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useContractStore } from '../stores/contractStore';
import { useClientStore } from '../stores/clientStore';
import { useMatterStore } from '../stores/matterStore';
import {
  Contract, CreateContractDto, UpdateContractDto, ContractType, ContractStatus,
  Client, Matter, ContractTimelineEvent,
} from '../types/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

// 合同类型标签与颜色
const typeLabels: Record<ContractType, string> = {
  PURCHASE_SALE: '买卖合同',
  SERVICE: '服务合同',
  EMPLOYMENT: '劳动合同',
  LEASE: '租赁合同',
  LOAN: '借款合同',
  CONSULTING: '咨询合同',
  OTHER: '其他',
};
const typeColors: Record<string, string> = {
  PURCHASE_SALE: 'blue',
  SERVICE: 'geekblue',
  EMPLOYMENT: 'purple',
  LEASE: 'cyan',
  LOAN: 'magenta',
  CONSULTING: 'gold',
  OTHER: 'default',
};

// 合同状态标签与颜色
const statusLabels: Record<ContractStatus, string> = {
  DRAFT: '草稿',
  REVIEWING: '审查中',
  PENDING_SIGN: '待签订',
  SIGNED: '已签订',
  EXECUTING: '执行中',
  COMPLETED: '已完成',
  TERMINATED: '已终止',
  EXPIRED: '已过期',
};
const statusColors: Record<ContractStatus, string> = {
  DRAFT: 'default',
  REVIEWING: 'blue',
  PENDING_SIGN: 'orange',
  SIGNED: 'green',
  EXECUTING: 'cyan',
  COMPLETED: 'gray',
  TERMINATED: 'red',
  EXPIRED: 'red',
};

// 状态流转定义: 当前状态 -> 可流转到的下一状态
const statusFlow: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ['REVIEWING'],
  REVIEWING: ['PENDING_SIGN', 'DRAFT'],
  PENDING_SIGN: ['SIGNED', 'DRAFT'],
  SIGNED: ['EXECUTING', 'TERMINATED'],
  EXECUTING: ['COMPLETED', 'TERMINATED'],
  COMPLETED: [],
  TERMINATED: [],
  EXPIRED: [],
};

const allStatuses: ContractStatus[] = [
  'DRAFT', 'REVIEWING', 'PENDING_SIGN', 'SIGNED', 'EXECUTING', 'COMPLETED', 'TERMINATED', 'EXPIRED',
];

const ContractListPage: React.FC = () => {
  const {
    contracts, loading, pagination, fetchContracts, createContract,
    updateContract, deleteContract, updateStatus, fetchTimeline,
  } = useContractStore();
  const { clients, fetchClients } = useClientStore();
  const { matters, fetchMatters } = useMatterStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<ContractType | undefined>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewContract, setViewContract] = useState<Contract | null>(null);
  const [timeline, setTimeline] = useState<ContractTimelineEvent[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchClients({ page: 1, pageSize: 100 });
    fetchMatters({ page: 1, pageSize: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchContracts({ page: 1, pageSize: 10, search, status: statusFilter, contractType: typeFilter });
  }, [search, statusFilter, typeFilter]);

  const loadPage = (page: number, pageSize: number) => {
    fetchContracts({ page, pageSize, search, status: statusFilter, contractType: typeFilter });
  };

  const refresh = () => {
    fetchContracts({ page: pagination.page, pageSize: pagination.pageSize, search, status: statusFilter, contractType: typeFilter });
  };

  const handleSubmit = async (values: any) => {
    try {
      const data: CreateContractDto = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
        signDate: values.signDate ? values.signDate.format('YYYY-MM-DD') : undefined,
        reviewDate: values.reviewDate ? values.reviewDate.format('YYYY-MM-DD') : undefined,
      };
      if (editingContract) {
        await updateContract(editingContract.id, data as UpdateContractDto);
        message.success('合同更新成功');
      } else {
        await createContract(data);
        message.success('合同创建成功');
      }
      setIsDrawerOpen(false);
      form.resetFields();
      setEditingContract(null);
      refresh();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const openCreate = () => {
    setEditingContract(null);
    form.resetFields();
    form.setFieldsValue({ currency: 'CNY', contractType: 'SERVICE', status: 'DRAFT' });
    setIsDrawerOpen(true);
  };

  const openEdit = (contract: Contract) => {
    setEditingContract(contract);
    form.setFieldsValue({
      ...contract,
      startDate: contract.startDate ? dayjs(contract.startDate) : undefined,
      endDate: contract.endDate ? dayjs(contract.endDate) : undefined,
      signDate: contract.signDate ? dayjs(contract.signDate) : undefined,
      reviewDate: contract.reviewDate ? dayjs(contract.reviewDate) : undefined,
    });
    setIsDrawerOpen(true);
  };

  const openView = async (contract: Contract) => {
    setViewContract(contract);
    try {
      const tl = await fetchTimeline(contract.id);
      setTimeline(tl);
    } catch {
      setTimeline([]);
    }
  };

  const handleStatusChange = async (contract: Contract, nextStatus: ContractStatus) => {
    try {
      const updated = await updateStatus(contract.id, { status: nextStatus });
      message.success(`合同状态已更新为「${statusLabels[nextStatus]}」`);
      if (viewContract && viewContract.id === contract.id) {
        setViewContract(updated);
      }
      refresh();
    } catch (e: any) {
      message.error(e.message || '状态更新失败');
    }
  };

  const columns = [
    {
      title: '合同编号', dataIndex: 'contractNo', width: 180,
      render: (v: string, r: Contract) => (
        <Button type="link" onClick={() => openView(r)}>{v}</Button>
      ),
    },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '客户', dataIndex: 'client', width: 160,
      render: (_: any, r: Contract) => r.client?.name || '-',
    },
    {
      title: '合同类型', dataIndex: 'contractType', width: 110,
      render: (v: ContractType) => <Tag color={typeColors[v]}>{typeLabels[v] || v}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: ContractStatus) => <Tag color={statusColors[v]}>{statusLabels[v] || v}</Tag>,
    },
    {
      title: '金额', dataIndex: 'amount', width: 130, align: 'right' as const,
      render: (v: number | null, r: Contract) => (
        v != null ? `${r.currency === 'CNY' ? '¥' : r.currency + ' '}${v.toLocaleString()}` : '-'
      ),
    },
    {
      title: '签订日期', dataIndex: 'signDate', width: 120,
      render: (v: string | null) => v || '-',
    },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right' as const,
      render: (_: any, record: Contract) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => openView(record)} />
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm title="确认删除?" onConfirm={async () => {
            try {
              await deleteContract(record.id);
              message.success('已删除');
              refresh();
            } catch (e: any) {
              message.error(e.message || '删除失败');
            }
          }}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 状态筛选 Tabs
  const statusTabs = [
    { key: 'ALL', label: '全部' },
    ...allStatuses.map((s) => ({ key: s, label: statusLabels[s] })),
  ];

  return (
    <div>
      <Title level={4}>合同管理</Title>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle" style={{ marginBottom: 12 }}>
          <Col flex="auto">
            <Input
              placeholder="搜索合同编号 / 标题 / 客户 / 相对方"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="合同类型"
              allowClear
              style={{ width: 130 }}
              value={typeFilter}
              onChange={(v) => setTypeFilter(v)}
            >
              {Object.entries(typeLabels).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建合同</Button>
          </Col>
        </Row>
        <Tabs
          activeKey={statusFilter || 'ALL'}
          onChange={(k) => setStatusFilter(k === 'ALL' ? undefined : (k as ContractStatus))}
          items={statusTabs.map((t) => ({ key: t.key, label: t.label }))}
          size="small"
        />
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={contracts}
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: loadPage,
        }}
      />

      {/* 新建 / 编辑 Drawer */}
      <Drawer
        title={editingContract ? '编辑合同' : '新建合同'}
        width={720}
        open={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); form.resetFields(); }}
        extra={
          <Space>
            <Button onClick={() => { setIsDrawerOpen(false); form.resetFields(); }}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="title" label="合同标题" rules={[{ required: true, message: '请输入合同标题' }]}>
                <Input placeholder="合同标题" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contractType" label="合同类型" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <Option key={k} value={k}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="clientId" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
                <Select showSearch optionFilterProp="label" placeholder="选择客户">
                  {clients.map((c: Client) => <Option key={c.id} value={c.id} label={c.name}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="matterId" label="关联业务（可选）">
                <Select allowClear showSearch optionFilterProp="label" placeholder="选择关联业务">
                  {matters.map((m: Matter) => <Option key={m.id} value={m.id} label={`${m.matterNo} - ${m.title}`}>{m.matterNo} - {m.title}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="合同金额">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currency" label="币种">
                <Select>
                  <Option value="CNY">CNY - 人民币</Option>
                  <Option value="USD">USD - 美元</Option>
                  <Option value="EUR">EUR - 欧元</Option>
                  <Option value="HKD">HKD - 港币</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="开始日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="结束日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="counterparty" label="相对方名称">
                <Input placeholder="合同相对方" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="counterpartyContact" label="相对方联系人">
                <Input placeholder="联系人" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="counterpartyPhone" label="相对方电话">
            <Input placeholder="联系电话" />
          </Form.Item>

          <Form.Item name="summary" label="合同摘要">
            <Input.TextArea rows={3} placeholder="合同核心内容摘要" />
          </Form.Item>

          <Form.Item name="content" label="合同正文">
            <Input.TextArea rows={6} placeholder="合同正文内容（支持 Markdown）" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 详情 Drawer */}
      <Drawer
        title="合同详情"
        width={640}
        open={!!viewContract}
        onClose={() => setViewContract(null)}
      >
        {viewContract && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="合同编号">{viewContract.contractNo}</Descriptions.Item>
              <Descriptions.Item label="标题">{viewContract.title}</Descriptions.Item>
              <Descriptions.Item label="合同类型">
                <Tag color={typeColors[viewContract.contractType]}>{typeLabels[viewContract.contractType] || viewContract.contractType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[viewContract.status]}>{statusLabels[viewContract.status] || viewContract.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="客户">{viewContract.client?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联业务">
                {viewContract.matter ? `${viewContract.matter.matterNo} - ${viewContract.matter.title}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="金额">
                {viewContract.amount != null ? `${viewContract.currency === 'CNY' ? '¥' : viewContract.currency + ' '}${viewContract.amount.toLocaleString()}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="开始日期">{viewContract.startDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{viewContract.endDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="签订日期">{viewContract.signDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="审查日期">{viewContract.reviewDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="相对方">{viewContract.counterparty || '-'}</Descriptions.Item>
              <Descriptions.Item label="相对方联系人">{viewContract.counterpartyContact || '-'}</Descriptions.Item>
              <Descriptions.Item label="相对方电话">{viewContract.counterpartyPhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="合同摘要">{viewContract.summary || '-'}</Descriptions.Item>
              <Descriptions.Item label="审查意见">{viewContract.reviewNotes || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{viewContract.createdBy?.realName || viewContract.createdBy?.username || '-'}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{new Date(viewContract.updatedAt).toLocaleString()}</Descriptions.Item>
            </Descriptions>

            {viewContract.content && (
              <Card title="合同正文" size="small" style={{ marginBottom: 16 }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{viewContract.content}</div>
              </Card>
            )}

            {/* 状态流转按钮 */}
            <Card title="状态流转" size="small" style={{ marginBottom: 16 }}>
              {statusFlow[viewContract.status]?.length ? (
                <Space wrap>
                  {statusFlow[viewContract.status].map((next) => (
                    <Button
                      key={next}
                      type={next === 'TERMINATED' ? 'default' : 'primary'}
                      danger={next === 'TERMINATED'}
                      onClick={() => handleStatusChange(viewContract, next)}
                    >
                      流转至「{statusLabels[next]}」
                    </Button>
                  ))}
                </Space>
              ) : (
                <Empty description="当前状态无后续流转" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            {/* 操作时间线 */}
            <Card title="操作时间线" size="small">
              {timeline.length ? (
                <Steps
                  direction="vertical"
                  size="small"
                  current={timeline.length - 1}
                  items={timeline.map((t) => ({
                    title: t.note || `${t.fromStatus || '创建'} → ${t.toStatus || ''}`,
                    description: new Date(t.createdAt).toLocaleString(),
                  }))}
                />
              ) : (
                <Empty description="暂无操作记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default ContractListPage;
