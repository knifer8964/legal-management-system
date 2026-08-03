import React, { useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Typography, Space } from 'antd';
import {
  TeamOutlined, FolderOpenOutlined, CheckSquareOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useClientStore } from '../stores/clientStore';
import { useMatterStore } from '../stores/matterStore';
import { useTaskStore } from '../stores/taskStore';
import { useTimeEntryStore } from '../stores/timeEntryStore';
import { Matter, Task, Priority } from '../types/api';

const { Title, Text } = Typography;

const matterStatusColors: Record<string, string> = {
  PENDING: 'default', IN_PROGRESS: 'processing', COMPLETED: 'success', CANCELLED: 'error',
};
const matterStatusLabels: Record<string, string> = {
  PENDING: '待处理', IN_PROGRESS: '进行中', COMPLETED: '已完成', CANCELLED: '已取消',
};
const priorityColors: Record<Priority, string> = { HIGH: 'red', MEDIUM: 'orange', LOW: 'blue' };
const priorityLabels: Record<Priority, string> = { HIGH: '高', MEDIUM: '中', LOW: '低' };

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { clients, fetchClients } = useClientStore();
  const { matters, fetchMatters } = useMatterStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { entries, fetchEntries, running, elapsed, fetchRunning } = useTimeEntryStore();

  useEffect(() => {
    fetchClients({ page: 1, pageSize: 100 });
    fetchMatters({ page: 1, pageSize: 100 });
    fetchTasks({ page: 1, pageSize: 100 });
    fetchEntries({ page: 1, pageSize: 100 });
    fetchRunning();
  }, []);

  const activeMatters = matters.filter((m) => m.status === 'IN_PROGRESS' || m.status === 'PENDING');
  const pendingTasks = tasks.filter((t) => t.status === 'TODO');
  const todayTime = entries.reduce((s, e) => s + (e.duration || 0), 0);
  const formatDuration = (min: number) => {
    if (min < 60) return `${min}分`;
    return `${(min / 60).toFixed(1)}时`;
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>工作概览</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/clients')}>
            <Statistic title="客户总数" value={clients.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/matters')}>
            <Statistic title="业务事项" value={matters.length}
              suffix={<Text type="secondary">/ {activeMatters.length} 进行中</Text>}
              prefix={<FolderOpenOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/tasks')}>
            <Statistic title="待办任务" value={pendingTasks.length}
              valueStyle={{ color: pendingTasks.length > 5 ? '#cf1322' : undefined }}
              prefix={<CheckSquareOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/time')}>
            <Statistic title="今日计时" value={formatDuration(todayTime)}
              prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {running && (
        <Card style={{ marginTop: 16, background: '#e6f7ff', border: '1px solid #91d5ff' }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Text strong style={{ fontSize: 16 }}>⏱️ 正在计时</Text>
              <Text style={{ marginLeft: 16 }}>{running.description}</Text>
              <Tag color="blue" style={{ marginLeft: 8 }}>{running.matter?.title}</Tag>
            </Col>
            <Col>
              <Title level={2} type="success" style={{ margin: 0, fontFamily: 'monospace' }}>
                {Math.floor(elapsed / 3600).toString().padStart(2, '0')}:
                {Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')}:
                {(elapsed % 60).toString().padStart(2, '0')}
              </Title>
            </Col>
          </Row>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="进行中的业务" extra={<a onClick={() => navigate('/matters')}>查看全部</a>}>
            <List
              dataSource={activeMatters.slice(0, 5)}
              renderItem={(item: Matter) => (
                <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/matters/${item.id}`)}>
                  <List.Item.Meta
                    title={<Text strong>{item.matterNo} — {item.title}</Text>}
                    description={`${item.client?.name || ''} · ${item.deadline ? '截止 ' + new Date(item.deadline).toLocaleDateString() : '无截止日'}`}
                  />
                  <Space>
                    <Tag color={priorityColors[item.priority]}>{priorityLabels[item.priority]}</Tag>
                    <Tag color={matterStatusColors[item.status]}>{matterStatusLabels[item.status]}</Tag>
                  </Space>
                </List.Item>
              )}
              locale={{ emptyText: '暂无进行中的业务' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="待办任务" extra={<a onClick={() => navigate('/tasks')}>查看全部</a>}>
            <List
              dataSource={pendingTasks.slice(0, 5)}
              renderItem={(item: Task) => (
                <List.Item style={{ cursor: 'pointer' }}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{item.title}</Text>
                        {item.dueDate && new Date(item.dueDate) < new Date() && <Tag color="red">逾期</Tag>}
                      </Space>
                    }
                    description={`${item.matter?.title || ''} · ${item.dueDate ? '截止 ' + new Date(item.dueDate).toLocaleDateString() : '无截止日'}`}
                  />
                  <Tag color={priorityColors[item.priority]}>{priorityLabels[item.priority]}</Tag>
                </List.Item>
              )}
              locale={{ emptyText: '🎉 没有待办任务' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
