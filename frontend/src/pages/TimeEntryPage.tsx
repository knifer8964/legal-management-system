import React, { useEffect, useState } from 'react';
import {
  Card, Button, Table, Tag, Space, Typography, Modal, Form,
  Row, Col, Input, Select, DatePicker, message, Statistic, Row as ARow,
} from 'antd';
import { PlayCircleOutlined, StopOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTimeEntryStore } from '../stores/timeEntryStore';
import { useClientStore } from '../stores/clientStore';
import { useMatterStore } from '../stores/matterStore';
import { TimeEntry, CreateTimeEntryDto, Client, Matter } from '../types/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const formatDuration = (min: number | null) => {
  if (!min) return '-';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}时${m}分` : `${m}分`;
};

const TimeEntryPage: React.FC = () => {
  const { entries, running, elapsed, fetchEntries, fetchRunning, startTimer, stopTimer, deleteEntry } = useTimeEntryStore();
  const { clients, fetchClients } = useClientStore();
  const { matters, fetchMatters } = useMatterStore();

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchClients({ page: 1, pageSize: 100 });
    fetchMatters({ page: 1, pageSize: 100 });
    fetchEntries({ page: 1, pageSize: 20 });
    fetchRunning();
  }, []);

  const totalMinutes = entries.reduce((s, e) => s + (e.duration || 0), 0);
  const totalAmount = entries.reduce((s, e) => s + (e.amount || 0), 0);

  const handleStart = async (values: any) => {
    try {
      await startTimer({
        matterId: values.matterId,
        clientId: values.clientId,
        description: values.description,
        isBillable: values.isBillable ?? true,
      });
      message.success('计时开始');
      setIsStartModalOpen(false);
      form.resetFields();
    } catch (e: any) {
      message.error(e.response?.data?.message || e.message || '启动计时失败');
    }
  };

  const handleStop = async () => {
    if (!running) return;
    try {
      await stopTimer(running.id);
      message.success('计时结束');
      fetchEntries({ page: 1, pageSize: 20 });
    } catch (e: any) {
      message.error(e.message || '停止计时失败');
    }
  };

  const columns = [
    { title: '描述', dataIndex: 'description', render: (v: string) => <Text>{v}</Text> },
    { title: '业务', dataIndex: ['matter', 'title'], render: (_: any, r: TimeEntry) => r.matter?.title || '-' },
    { title: '客户', dataIndex: ['client', 'name'], render: (_: any, r: TimeEntry) => r.client?.name || '-' },
    { title: '开始时间', dataIndex: 'startTime', render: (v: string) => new Date(v).toLocaleString() },
    { title: '时长', dataIndex: 'duration', render: (v: number | null) => formatDuration(v) },
    { title: '金额', dataIndex: 'amount', render: (v: number | null) => v ? `¥${v.toFixed(2)}` : '-' },
    { title: '计费', dataIndex: 'isBillable', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag> },
    { title: '已开票', dataIndex: 'isBilled', render: (v: boolean) => <Tag color={v ? 'blue' : 'default'}>{v ? '是' : '否'}</Tag> },
    { title: '操作', key: 'action', render: (_: any, r: TimeEntry) => (
      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteEntry(r.id)} />
    )},
  ];

  return (
    <div>
      <Title level={4}>计时收费</Title>

      {/* 计时状态条 */}
      {running ? (
        <Card style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <ARow align="middle" justify="space-between">
            <Col>
              <Text strong style={{ fontSize: 16 }}>⏱️ 正在计时</Text>
              <Text style={{ marginLeft: 16 }}>{running.description}</Text>
              <Tag color="blue" style={{ marginLeft: 8 }}>{running.matter?.title}</Tag>
            </Col>
            <Col>
              <Title level={2} type="success" style={{ margin: 0, fontFamily: 'monospace' }}>
                {String(Math.floor(elapsed / 3600)).padStart(2, '0')}:
                {String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}:
                {String(elapsed % 60).padStart(2, '0')}
              </Title>
            </Col>
            <Col>
              <Button danger icon={<StopOutlined />} onClick={handleStop}>停止计时</Button>
            </Col>
          </ARow>
        </Card>
      ) : (
        <Card style={{ marginBottom: 16, background: '#fff' }}>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setIsStartModalOpen(true)}>开始计时</Button>
        </Card>
      )}

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Statistic title="总计时长" value={formatDuration(totalMinutes)} /></Col>
        <Col xs={12} md={6}><Statistic title="总金额" value={`¥${totalAmount.toFixed(2)}`} /></Col>
        <Col xs={12} md={6}><Statistic title="记录数" value={entries.length} /></Col>
        <Col xs={12} md={6}><Statistic title="本月计费" value={entries.filter(e => e.isBillable).reduce((s, e) => s + (e.amount || 0), 0).toFixed(2)} prefix="¥" /></Col>
      </Row>

      {/* 计时记录列表 */}
      <Table rowKey="id" columns={columns} dataSource={entries}
        pagination={{ pageSize: 20, showSizeChanger: true }} />

      <Modal title="开始计时" open={isStartModalOpen} onOk={() => form.submit()} onCancel={() => setIsStartModalOpen(false)}>
        <Form form={form} layout="vertical" onFinish={handleStart}>
          <Form.Item name="clientId" label="客户" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children" onChange={() => form.setFieldValue('matterId', undefined)}>
              {clients.map((c: Client) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="matterId" label="关联业务">
            <Select showSearch optionFilterProp="children" allowClear>
              {matters.map((m: Matter) => <Option key={m.id} value={m.id}>{m.matterNo} - {m.title}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="计时描述" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="例：审阅合同第3-5条" />
          </Form.Item>
          <Form.Item name="isBillable" label="是否计费" initialValue={true}>
            <Select>
              <Option value={true}>是（计费）</Option>
              <Option value={false}>否（免费）</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TimeEntryPage;
