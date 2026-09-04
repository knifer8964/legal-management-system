import React, { useEffect, useState } from 'react';
import {
  Card, Button, Table, Tag, Space, Typography, Modal, Form,
  Row, Col, Input, Select, message, Popconfirm, Drawer, Descriptions,
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCommunicationStore } from '../stores/communicationStore';
import { useClientStore } from '../stores/clientStore';
import { useMatterStore } from '../stores/matterStore';
import {
  Communication, CreateCommunicationDto, UpdateCommunicationDto,
  CommChannel, Direction, Client, Matter,
} from '../types/api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const channelLabels: Record<CommChannel, string> = {
  WECHAT: '微信', EMAIL: '邮件', SMS: '短信', PHONE: '电话',
  MEETING: '面谈', VIDEO: '视频', SYSTEM: '系统', OTHER: '其他',
};
const channelColors: Record<CommChannel, string> = {
  WECHAT: 'green', EMAIL: 'purple', SMS: 'blue', PHONE: 'cyan',
  MEETING: 'orange', VIDEO: 'geekblue', SYSTEM: 'default', OTHER: 'default',
};

const CommunicationPage: React.FC = () => {
  const { communications, loading, fetchCommunications, createCommunication, updateCommunication, deleteCommunication } = useCommunicationStore();
  const { clients, fetchClients } = useClientStore();
  const { matters, fetchMatters } = useMatterStore();

  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<CommChannel | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComm, setEditingComm] = useState<Communication | null>(null);
  const [viewComm, setViewComm] = useState<Communication | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchClients({ page: 1, pageSize: 100 }); fetchMatters({ page: 1, pageSize: 100 }); }, []);
  useEffect(() => {
    fetchCommunications({ page: 1, pageSize: 20, search, channel: channelFilter });
  }, [search, channelFilter]);

  const handleSubmit = async (values: any) => {
    try {
      const data: CreateCommunicationDto = { ...values };
      if (editingComm) {
        await updateCommunication(editingComm.id, data as UpdateCommunicationDto);
        message.success('沟通记录更新成功');
      } else {
        await createCommunication(data);
        message.success('沟通记录创建成功');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingComm(null);
      fetchCommunications({ page: 1, pageSize: 20, search, channel: channelFilter });
    } catch (e: any) {
      message.error(e.response?.data?.message || e.message || '操作失败');
    }
  };

  const openCreate = () => { setEditingComm(null); form.resetFields(); setIsModalOpen(true); };
  const openEdit = (c: Communication) => {
    setEditingComm(c);
    form.setFieldsValue(c);
    setIsModalOpen(true);
  };

  const columns = [
    { title: '时间', dataIndex: 'createdAt', width: 170, render: (v: string) => new Date(v).toLocaleString() },
    { title: '客户', dataIndex: ['client', 'name'], render: (_: any, r: Communication) => r.client?.name || '-' },
    { title: '渠道', dataIndex: 'channel', width: 100, render: (v: CommChannel) => (
      <Tag color={channelColors[v]}>{channelLabels[v]}</Tag>
    )},
    { title: '方向', dataIndex: 'direction', width: 90, render: (v: Direction) => (
      <Tag color={v === 'INBOUND' ? 'blue' : 'green'}>{v === 'INBOUND' ? ' inbound' : ' outbound'}</Tag>
    )},
    { title: '主题', dataIndex: 'subject', render: (v: string, r: Communication) => (
      <Button type="link" onClick={() => setViewComm(r)}>{v || '(无主题)'}</Button>
    )},
    { title: '联系人', dataIndex: 'contactName', width: 120, render: (v: string) => v || '-' },
    { title: '操作', key: 'action', width: 140, fixed: 'right' as const, render: (_: any, r: Communication) => (
      <Space>
        <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
        <Popconfirm title="确认删除?" onConfirm={() => { deleteCommunication(r.id); fetchCommunications({}); }}>
          <Button icon={<DeleteOutlined />} danger size="small" />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <Title level={4}>沟通记录</Title>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input placeholder="搜索主题 / 内容 / 联系人" prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear />
          </Col>
          <Col>
            <Select placeholder="渠道" allowClear style={{ width: 120 }} value={channelFilter} onChange={(v) => setChannelFilter(v)}>
              {Object.entries(channelLabels).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
            </Select>
          </Col>
          <Col><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增记录</Button></Col>
        </Row>
      </Card>

      <Table rowKey="id" columns={columns} dataSource={communications} loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }} />

      <Modal title={editingComm ? '编辑沟通记录' : '新增沟通记录'} open={isModalOpen} onOk={() => form.submit()} onCancel={() => { setIsModalOpen(false); form.resetFields(); }} width={720}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="clientId" label="客户" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="children">
                  {clients.map((c: Client) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="matterId" label="关联业务">
                <Select showSearch optionFilterProp="children" allowClear>
                  {matters.map((m: Matter) => <Option key={m.id} value={m.id}>{m.matterNo} - {m.title}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="channel" label="沟通渠道" rules={[{ required: true }]} initialValue="PHONE">
                <Select>{Object.entries(channelLabels).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="direction" label="方向" rules={[{ required: true }]} initialValue="OUTBOUND">
                <Select><Option value="INBOUND"> inbound</Option><Option value="OUTBOUND"> outbound</Option></Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="subject" label="主题"><Input /></Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}><TextArea rows={4} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="contactName" label="联系人"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="contactInfo" label="联系方式"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Drawer title="沟通详情" width={560} open={!!viewComm} onClose={() => setViewComm(null)}>
        {viewComm && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="客户">{viewComm.client?.name}</Descriptions.Item>
            <Descriptions.Item label="渠道"><Tag color={channelColors[viewComm.channel]}>{channelLabels[viewComm.channel]}</Tag></Descriptions.Item>
            <Descriptions.Item label="方向"><Tag color={viewComm.direction === 'INBOUND' ? 'blue' : 'green'}>{viewComm.direction === 'INBOUND' ? ' inbound' : ' outbound'}</Tag></Descriptions.Item>
            <Descriptions.Item label="主题">{viewComm.subject || '-'}</Descriptions.Item>
            <Descriptions.Item label="内容">{viewComm.content}</Descriptions.Item>
            <Descriptions.Item label="联系人">{viewComm.contactName || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系方式">{viewComm.contactInfo || '-'}</Descriptions.Item>
            <Descriptions.Item label="时间">{new Date(viewComm.createdAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default CommunicationPage;
