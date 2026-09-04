import React, { useEffect, useState } from 'react';
import {
  Card, Button, Input, Space, Tag, Modal, Form, Row, Col,
  message, Popconfirm, Typography, Select, DatePicker, List,
} from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useTaskStore } from '../stores/taskStore';
import { useMatterStore } from '../stores/matterStore';
import { useUserStore } from '../stores/userStore';
import { Task, CreateTaskDto, UpdateTaskDto, TaskStatus, Priority, Matter, User } from '../types/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const priorityColors: Record<Priority, string> = { HIGH: 'red', MEDIUM: 'orange', LOW: 'blue', URGENT: 'purple' };
const priorityLabels: Record<Priority, string> = { HIGH: '高', MEDIUM: '中', LOW: '低', URGENT: '紧急' };

// 四列看板列定义
const BOARD_COLUMNS: { key: TaskStatus; title: string; color: string }[] = [
  { key: 'TODO', title: '待办', color: 'orange' },
  { key: 'IN_PROGRESS', title: '进行中', color: 'blue' },
  { key: 'DONE', title: '已完成', color: 'green' },
  { key: 'CANCELLED', title: '已取消', color: 'default' },
];

const TaskBoardPage: React.FC = () => {
  const { tasks, loading, fetchTasks, createTask, updateTask, toggleTask, deleteTask } = useTaskStore();
  const { matters, fetchMatters } = useMatterStore();
  const { users, fetchUsers } = useUserStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMatters({ page: 1, pageSize: 100 });
    fetchUsers({ page: 1, pageSize: 200 });
  }, []);
  useEffect(() => {
    fetchTasks({ page: 1, pageSize: 200, search, status: statusFilter });
  }, [search, statusFilter]);

  const handleSubmit = async (values: any) => {
    try {
      const data: CreateTaskDto = {
        ...values,
        userId: values.userId,
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
      };
      if (editingTask) {
        await updateTask(editingTask.id, data as UpdateTaskDto);
        message.success('任务更新成功');
      } else {
        await createTask(data);
        message.success('任务创建成功');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingTask(null);
      fetchTasks({ page: 1, pageSize: 200, search, status: statusFilter });
    } catch (e: any) {
      message.error(e.response?.data?.message || e.message || '操作失败');
    }
  };

  const openCreate = () => { setEditingTask(null); form.resetFields(); setIsModalOpen(true); };
  const openEdit = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      ...task,
      userId: task.userId,
      dueDate: task.dueDate ? dayjs(task.dueDate) : undefined,
    });
    setIsModalOpen(true);
  };

  const renderTaskCard = (task: Task) => (
    <Card size="small" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => openEdit(task)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text strong>{task.title}</Text>
          <div><Text type="secondary" style={{ fontSize: 12 }}>{task.matter?.title || '无关联业务'}</Text></div>
          {task.user && (
            <div><Text type="secondary" style={{ fontSize: 12 }}>负责人: {task.user.realName || task.user.username}</Text></div>
          )}
          {task.dueDate && (
            <Tag color={new Date(task.dueDate) < new Date() ? 'red' : 'default'} style={{ marginTop: 8 }}>
              截止 {new Date(task.dueDate).toLocaleDateString()}
            </Tag>
          )}
        </div>
        <Space>
          <Tag color={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Tag>
          <Button size="small" icon={task.status === 'TODO' ? <CheckOutlined /> : undefined}
            onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}>
            {task.status === 'TODO' ? '完成' : '重做'}
          </Button>
          <Popconfirm title="确认删除?" onConfirm={(e) => { e?.stopPropagation(); deleteTask(task.id); fetchTasks({}); }}>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </Space>
      </div>
    </Card>
  );

  const renderColumn = (col: { key: TaskStatus; title: string; color: string }) => {
    const colTasks = tasks.filter((t) => t.status === col.key);
    return (
      <Col xs={24} sm={12} md={6} key={col.key}>
        <Card
          title={<span>{col.title} <Tag color={col.color}>{colTasks.length}</Tag></span>}
          style={{ minHeight: 300 }}
        >
          {colTasks.map(renderTaskCard)}
          {colTasks.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>暂无任务</div>
          )}
        </Card>
      </Col>
    );
  };

  return (
    <div>
      <Title level={4}>任务管理</Title>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input placeholder="搜索任务标题" prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear />
          </Col>
          <Col>
            <Select placeholder="状态" allowClear style={{ width: 120 }} value={statusFilter} onChange={(v) => setStatusFilter(v)}>
              <Option value="TODO">待办</Option>
              <Option value="IN_PROGRESS">进行中</Option>
              <Option value="DONE">已完成</Option>
              <Option value="CANCELLED">已取消</Option>
            </Select>
          </Col>
          <Col><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建任务</Button></Col>
        </Row>
      </Card>

      {statusFilter ? (
        <List loading={loading} dataSource={tasks} renderItem={(task) => <List.Item>{renderTaskCard(task)}</List.Item>} />
      ) : (
        <Row gutter={16}>
          {BOARD_COLUMNS.map(renderColumn)}
        </Row>
      )}

      <Modal title={editingTask ? '编辑任务' : '新建任务'} open={isModalOpen} onOk={() => form.submit()} onCancel={() => { setIsModalOpen(false); form.resetFields(); }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="matterId" label="关联业务">
            <Select showSearch optionFilterProp="children" allowClear>
              {matters.map((m: Matter) => <Option key={m.id} value={m.id}>{m.matterNo} - {m.title}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="userId" label="负责人">
            <Select showSearch optionFilterProp="children" allowClear placeholder="选择负责人">
              {users.map((u: User) => <Option key={u.id} value={u.id}>{u.realName || u.username}</Option>)}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" initialValue="MEDIUM">
                <Select><Option value="HIGH">高</Option><Option value="MEDIUM">中</Option><Option value="LOW">低</Option><Option value="URGENT">紧急</Option></Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="TODO">
                <Select><Option value="TODO">待办</Option><Option value="IN_PROGRESS">进行中</Option><Option value="DONE">已完成</Option><Option value="CANCELLED">已取消</Option></Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dueDate" label="截止日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskBoardPage;
