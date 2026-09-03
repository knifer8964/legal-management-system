import React, { useEffect, useState } from 'react';
import {
  Table, Card, Button, Input, Space, Tag, Modal, Form,
  Row, Col, message, Popconfirm, Typography, Descriptions,
  Drawer, Select, Radio, DatePicker, InputNumber,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useClientStore } from '../stores/clientStore';
import { Client, CreateClientDto, UpdateClientDto, ClientType, ClientStatus } from '../types/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const typeLabels: Record<ClientType, string> = {
  PERSONAL: '个人', ENTERPRISE: '企业',
};
const typeColors: Record<string, string> = {
  PERSONAL: 'blue', ENTERPRISE: 'purple',
};
const statusLabels: Record<ClientStatus, string> = {
  ACTIVE: '活跃', INACTIVE: '停用', POTENTIAL: '潜在', CLOSED: '已关闭',
};
const statusColors: Record<ClientStatus, string> = {
  ACTIVE: 'green', INACTIVE: 'default', POTENTIAL: 'orange', CLOSED: 'red',
};

const servicePlanLabels: Record<string, string> = {
  RETAINER: '常年顾问',
  HOURLY: '按小时',
  FIXED: '固定费用',
  NONE: '无',
};

const ClientListPage: React.FC = () => {
  const {
    clients, loading, pagination, fetchClients, createClient,
    updateClient, deleteClient,
  } = useClientStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ClientType | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchClients({ page: 1, pageSize: 10, search, clientType: typeFilter });
  }, [search, typeFilter]);

  const loadPage = (page: number, pageSize: number) => {
    fetchClients({ page, pageSize, search, clientType: typeFilter });
  };

  const handleSubmit = async (values: any) => {
    try {
      const data: CreateClientDto = {
        ...values,
        serviceStart: values.serviceStart ? values.serviceStart.format('YYYY-MM-DD') : undefined,
        serviceEnd: values.serviceEnd ? values.serviceEnd.format('YYYY-MM-DD') : undefined,
      };
      if (editingClient) {
        await updateClient(editingClient.id, data as UpdateClientDto);
        message.success('客户更新成功');
      } else {
        await createClient(data);
        message.success('客户创建成功');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingClient(null);
      fetchClients({ page: 1, pageSize: 10, search, clientType: typeFilter });
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const openCreate = () => {
    setEditingClient(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    form.setFieldsValue({
      ...client,
      tags: client.tags?.join(', '),
      serviceStart: client.serviceStart ? dayjs(client.serviceStart) : undefined,
      serviceEnd: client.serviceEnd ? dayjs(client.serviceEnd) : undefined,
    });
    setIsModalOpen(true);
  };

  const columns = [
    { title: '名称', dataIndex: 'name', render: (v: string, r: Client) => (
      <Button type="link" onClick={() => setViewClient(r)}>{v}</Button>
    )},
    { title: '类型', dataIndex: 'clientType', width: 100, render: (v: ClientType) => (
      <Tag color={typeColors[v]}>{typeLabels[v] || v}</Tag>
    )},
    { title: '联系人', dataIndex: 'contactName', width: 120, render: (v: string, r: Client) => v || r.contactPhone || '-' },
    { title: '电话', dataIndex: 'phone', width: 140 },
    { title: '邮箱', dataIndex: 'email', width: 180, render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', width: 100, render: (v: ClientStatus) => (
      <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>
    )},
    { title: '业务数', dataIndex: 'totalMatters', width: 90 },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170, render: (v: string) => new Date(v).toLocaleString() },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right' as const,
      render: (_: any, record: Client) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm title="确认删除?" onConfirm={async () => {
            await deleteClient(record.id);
            message.success('已删除');
            fetchClients({ page: 1, pageSize: 10, search, clientType: typeFilter });
          }}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>客户管理</Title>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="搜索名称 / 手机 / 邮箱 / 联系人"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="客户类型"
              allowClear
              style={{ width: 120 }}
              value={typeFilter}
              onChange={(v) => setTypeFilter(v)}
            >
              <Option value="PERSONAL">个人</Option>
              <Option value="ENTERPRISE">企业</Option>
            </Select>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建客户</Button>
          </Col>
        </Row>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={clients}
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: loadPage,
        }}
      />

      <Modal
        title={editingClient ? '编辑客户' : '新建客户'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="clientType" label="客户类型" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio.Button value="PERSONAL">个人</Radio.Button>
              <Radio.Button value="ENTERPRISE">企业</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shortName" label="简称">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contactName" label="对接人">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPhone" label="对接人电话">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="servicePlan" label="服务计划">
                <Select allowClear placeholder="选择服务计划">
                  {Object.entries(servicePlanLabels).map(([k, v]) => (
                    <Option key={k} value={k}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="monthlyFee" label="月费（元）">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="serviceStart" label="服务开始">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="serviceEnd" label="服务结束">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="客户详情"
        width={560}
        open={!!viewClient}
        onClose={() => setViewClient(null)}
      >
        {viewClient && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="名称">{viewClient.name}</Descriptions.Item>
            <Descriptions.Item label="类型"><Tag color={typeColors[viewClient.clientType]}>{typeLabels[viewClient.clientType]}</Tag></Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusColors[viewClient.status]}>{statusLabels[viewClient.status]}</Tag></Descriptions.Item>
            <Descriptions.Item label="电话">{viewClient.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{viewClient.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="对接人">{viewClient.contactName || '-'}</Descriptions.Item>
            <Descriptions.Item label="对接人电话">{viewClient.contactPhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="地址">{viewClient.address || '-'}</Descriptions.Item>
            <Descriptions.Item label="服务计划">{viewClient.servicePlan ? (servicePlanLabels[viewClient.servicePlan] || viewClient.servicePlan) : '-'}</Descriptions.Item>
            <Descriptions.Item label="月费">{viewClient.monthlyFee != null ? `¥${viewClient.monthlyFee}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="服务开始">{viewClient.serviceStart || '-'}</Descriptions.Item>
            <Descriptions.Item label="服务结束">{viewClient.serviceEnd || '-'}</Descriptions.Item>
            <Descriptions.Item label="业务数">{viewClient.totalMatters}</Descriptions.Item>
            <Descriptions.Item label="累计金额">¥{viewClient.totalAmount}</Descriptions.Item>
            <Descriptions.Item label="备注">{viewClient.notes || '-'}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{new Date(viewClient.updatedAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default ClientListPage;
