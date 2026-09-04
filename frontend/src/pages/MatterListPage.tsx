import React, { useEffect, useState } from 'react';
import {
  Table, Card, Button, Input, Space, Tag, Modal, Form,
  Row, Col, message, Popconfirm, Typography, Descriptions,
  Drawer, Select, DatePicker,
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMatterStore } from '../stores/matterStore';
import { useClientStore } from '../stores/clientStore';
import {
  Matter, CreateMatterDto, UpdateMatterDto, MatterType,
  MatterStatus, Priority, FeeType, Client,
} from '../types/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const typeLabels: Record<MatterType, string> = {
  CONSULTATION: '法律咨询', CONTRACT_REVIEW: '合同审查', CONTRACT_DRAFT: '合同起草',
  CASE_LITIGATION: '诉讼案件', CASE_ARBITRATION: '仲裁案件', CASE_MEDIATION: '调解案件',
  COMPLIANCE: '合规顾问', TRAINING: '法律培训', DOCUMENT_DRAFT: '文书代写', OTHER: '其他',
};
const statusColors: Record<MatterStatus, string> = {
  PENDING: 'default', IN_PROGRESS: 'processing', WAITING_CLIENT: 'warning',
  REVIEWING: 'purple', COMPLETED: 'success', ARCHIVED: 'default', CANCELLED: 'error',
};
const statusLabels: Record<MatterStatus, string> = {
  PENDING: '待处理', IN_PROGRESS: '进行中', WAITING_CLIENT: '等待客户',
  REVIEWING: '内部复核', COMPLETED: '已完成', ARCHIVED: '已归档', CANCELLED: '已取消',
};
const priorityColors: Record<Priority, string> = { HIGH: 'red', MEDIUM: 'orange', LOW: 'blue', URGENT: 'purple' };
const priorityLabels: Record<Priority, string> = { HIGH: '高', MEDIUM: '中', LOW: '低', URGENT: '紧急' };
const feeLabels: Record<FeeType, string> = {
  FIXED: '固定费用', HOURLY: '计时收费', CONTINGENCY: '风险代理', MONTHLY: '月度顾问', FREE: '无偿',
};

const MatterListPage: React.FC = () => {
  const { matters, loading, pagination, fetchMatters, createMatter, updateMatter, deleteMatter } = useMatterStore();
  const { clients, fetchClients } = useClientStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MatterStatus | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatter, setEditingMatter] = useState<Matter | null>(null);
  const [viewMatter, setViewMatter] = useState<Matter | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchClients({ page: 1, pageSize: 100 }); }, []);
  useEffect(() => {
    fetchMatters({ page: 1, pageSize: 10, search, status: statusFilter });
  }, [search, statusFilter]);

  const loadPage = (page: number, pageSize: number) => {
    fetchMatters({ page, pageSize, search, status: statusFilter });
  };

  const handleSubmit = async (values: any) => {
    try {
      const { dateRange, ...rest } = values;
      const data: CreateMatterDto = {
        ...rest,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        deadline: dateRange?.[1]?.format('YYYY-MM-DD'),
      };
      if (editingMatter) {
        await updateMatter(editingMatter.id, data as UpdateMatterDto);
        message.success('业务更新成功');
      } else {
        await createMatter(data);
        message.success('业务创建成功');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingMatter(null);
      fetchMatters({ page: 1, pageSize: 10, search, status: statusFilter });
    } catch (e: any) {
      message.error(e.response?.data?.message || e.message || '操作失败');
    }
  };

  const openCreate = () => {
    setEditingMatter(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEdit = (matter: Matter) => {
    setEditingMatter(matter);
    form.setFieldsValue({
      ...matter,
      dateRange: matter.startDate && matter.deadline
        ? [dayjs(matter.startDate), dayjs(matter.deadline)]
        : undefined,
    });
    setIsModalOpen(true);
  };

  const columns = [
    { title: '编号', dataIndex: 'matterNo', width: 150 },
    { title: '标题', dataIndex: 'title', render: (v: string, r: Matter) => (
      <Button type="link" onClick={() => setViewMatter(r)}>{v}</Button>
    )},
    { title: '类型', dataIndex: 'matterType', width: 120, render: (v: MatterType) => typeLabels[v] },
    { title: '客户', dataIndex: ['client', 'name'], width: 140, render: (_: any, r: Matter) => r.client?.name || '-' },
    { title: '费用类型', dataIndex: 'feeType', width: 120, render: (v: FeeType) => feeLabels[v] },
    { title: '优先级', dataIndex: 'priority', width: 90, render: (v: Priority) => (
      <Tag color={priorityColors[v]}>{priorityLabels[v]}</Tag>
    )},
    { title: '状态', dataIndex: 'status', width: 100, render: (v: MatterStatus) => (
      <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>
    )},
    { title: '进度', dataIndex: 'progress', width: 120, render: (v: number) => <Text>{v}%</Text> },
    { title: '截止日', dataIndex: 'deadline', width: 120, render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right' as const,
      render: (_: any, record: Matter) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm title="确认删除?" onConfirm={async () => {
            await deleteMatter(record.id);
            message.success('已删除');
            fetchMatters({ page: 1, pageSize: 10, search, status: statusFilter });
          }}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>业务事项</Title>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input placeholder="搜索编号 / 标题" prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear />
          </Col>
          <Col>
            <Select placeholder="状态" allowClear style={{ width: 120 }} value={statusFilter} onChange={(v) => setStatusFilter(v)}>
              <Option value="PENDING">待处理</Option>
              <Option value="IN_PROGRESS">进行中</Option>
              <Option value="WAITING_CLIENT">等待客户</Option>
              <Option value="REVIEWING">内部复核</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="ARCHIVED">已归档</Option>
              <Option value="CANCELLED">已取消</Option>
            </Select>
          </Col>
          <Col><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建业务</Button></Col>
        </Row>
      </Card>

      <Table rowKey="id" columns={columns} dataSource={matters} loading={loading}
        pagination={{ current: pagination.page, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, onChange: loadPage }} />

      <Modal title={editingMatter ? '编辑业务' : '新建业务'} open={isModalOpen} onOk={() => form.submit()} onCancel={() => { setIsModalOpen(false); form.resetFields(); }} width={720}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="clientId" label="客户" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="children">
                  {clients.map((c: Client) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="matterType" label="业务类型" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(typeLabels).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="feeType" label="费用类型" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(feeLabels).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="priority" label="优先级" initialValue="MEDIUM">
                <Select>
                  <Option value="HIGH">高</Option>
                  <Option value="MEDIUM">中</Option>
                  <Option value="LOW">低</Option>
                  <Option value="URGENT">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态" initialValue="PENDING">
                <Select>
                  <Option value="PENDING">待处理</Option>
                  <Option value="IN_PROGRESS">进行中</Option>
                  <Option value="WAITING_CLIENT">等待客户</Option>
                  <Option value="REVIEWING">内部复核</Option>
                  <Option value="COMPLETED">已完成</Option>
                  <Option value="ARCHIVED">已归档</Option>
                  <Option value="CANCELLED">已取消</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="feeAmount" label="固定费用/小时费率"><Input type="number" /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="dateRange" label="起止日期"><RangePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Drawer title="业务详情" width={560} open={!!viewMatter} onClose={() => setViewMatter(null)}>
        {viewMatter && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="编号">{viewMatter.matterNo}</Descriptions.Item>
            <Descriptions.Item label="标题">{viewMatter.title}</Descriptions.Item>
            <Descriptions.Item label="类型">{typeLabels[viewMatter.matterType]}</Descriptions.Item>
            <Descriptions.Item label="客户">{viewMatter.client?.name}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusColors[viewMatter.status]}>{statusLabels[viewMatter.status]}</Tag></Descriptions.Item>
            <Descriptions.Item label="优先级"><Tag color={priorityColors[viewMatter.priority]}>{priorityLabels[viewMatter.priority]}</Tag></Descriptions.Item>
            <Descriptions.Item label="费用类型">{feeLabels[viewMatter.feeType]}</Descriptions.Item>
            <Descriptions.Item label="金额">{viewMatter.feeAmount ? `¥${viewMatter.feeAmount}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="进度">{viewMatter.progress}%</Descriptions.Item>
            <Descriptions.Item label="描述">{viewMatter.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{new Date(viewMatter.createdAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default MatterListPage;
