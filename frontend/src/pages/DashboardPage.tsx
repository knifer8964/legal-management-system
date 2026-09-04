import React, { useEffect, useState, useCallback } from 'react';
import {
  Row, Col, Card, Statistic, List, Tag, Typography, Space, Spin, Empty, Progress,
} from 'antd';
import {
  TeamOutlined, FolderOpenOutlined, CheckSquareOutlined,
  ClockCircleOutlined, DollarOutlined, FolderOutlined,
  AlertOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import { dashboardService, DashboardSummary } from '../services/dashboardService';

const { Title, Text } = Typography;

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];

const matterStatusLabels: Record<string, string> = {
  PENDING: '待处理', IN_PROGRESS: '进行中', WAITING_CLIENT: '等待客户',
  REVIEWING: '内部复核', COMPLETED: '已完成', ARCHIVED: '已归档', CANCELLED: '已取消',
};
const taskStatusLabels: Record<string, string> = {
  TODO: '待办', IN_PROGRESS: '进行中', DONE: '已完成', CANCELLED: '已取消',
};
const priorityColors: Record<string, string> = { HIGH: 'red', MEDIUM: 'orange', LOW: 'blue', URGENT: 'purple' };
const priorityLabels: Record<string, string> = { HIGH: '高', MEDIUM: '中', LOW: '低', URGENT: '紧急' };
const invoiceStatusLabels: Record<string, string> = {
  DRAFT: '草稿', ISSUED: '已开具', SENT: '已发送', PARTIAL: '部分付款',
  PAID: '已付清', OVERDUE: '逾期', CANCELLED: '已取消',
};

const formatDuration = (min: number) => {
  if (min < 60) return `${min}分`;
  return `${(min / 60).toFixed(1)}时`;
};

const formatCurrency = (n: number) => `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await dashboardService.getSummary();
      // http.ts 返回 response.data，即 { success, data, ... }
      const d = (res as any).data ?? res;
      setData(d);
    } catch (e) {
      console.error('Dashboard 数据加载失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  if (!data) {
    return <Empty description="数据加载失败" />;
  }

  // 图表数据
  const matterPieData = Object.entries(data.matters.byStatus).map(([k, v]) => ({
    name: matterStatusLabels[k] || k, value: v, key: k,
  }));
  const taskBarData = Object.entries(data.tasks.byStatus).map(([k, v]) => ({
    name: taskStatusLabels[k] || k, count: v,
  }));
  const invoiceBarData = Object.entries(data.invoices.statusBreakdown).map(([k, v]) => ({
    name: invoiceStatusLabels[k] || k, amount: v.amount, count: v.count,
  }));

  const collectionRate = data.invoices.totalAmount > 0
    ? Math.round((data.invoices.totalPaid / data.invoices.totalAmount) * 100)
    : 0;

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>工作概览</Title>

      {/* 统计卡片行 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/clients')}>
            <Statistic
              title="客户总数"
              value={data.clients.total}
              prefix={<TeamOutlined />}
              suffix={<Text type="secondary" style={{ fontSize: 14 }}>/ {data.clients.active} 活跃</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/matters')}>
            <Statistic
              title="业务事项"
              value={data.matters.total}
              prefix={<FolderOpenOutlined />}
              suffix={<Text type="secondary" style={{ fontSize: 14 }}>/ {data.matters.inProgress} 进行中</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/tasks')}>
            <Statistic
              title="待办任务"
              value={data.tasks.todo}
              valueStyle={{ color: data.tasks.todo > 5 ? '#cf1322' : undefined }}
              prefix={<CheckSquareOutlined />}
              suffix={
                data.tasks.overdueTasks.length > 0 ? (
                  <Text type="danger" style={{ fontSize: 14 }}>
                    <AlertOutlined /> {data.tasks.overdueTasks.length} 逾期
                  </Text>
                ) : undefined
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/invoices')}>
            <Statistic
              title="未收金额"
              value={formatCurrency(data.invoices.totalUnpaid)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: data.invoices.totalUnpaid > 0 ? '#cf1322' : '#3f8600' }}
              suffix={
                <Text type="secondary" style={{ fontSize: 14 }}>
                  / {formatCurrency(data.invoices.totalAmount)} 总额
                </Text>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 第二行：计时 + 文档 + 发票收款率 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/time')}>
            <Statistic
              title="本月计时"
              value={formatDuration(data.timeEntries.totalDuration)}
              prefix={<ClockCircleOutlined />}
              suffix={
                data.timeEntries.totalBillable > 0 ? (
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    / {formatCurrency(data.timeEntries.totalBillable)}
                  </Text>
                ) : undefined
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/documents')}>
            <Statistic
              title="文档数量"
              value={data.documents.totalDocuments}
              prefix={<FolderOutlined />}
              suffix={
                data.documents.totalSize > 0 ? (
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    / {formatFileSize(data.documents.totalSize)}
                  </Text>
                ) : undefined
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">发票收款率</Text>
            </div>
            <Progress
              percent={collectionRate}
              status={collectionRate >= 80 ? 'success' : collectionRate >= 50 ? 'normal' : 'exception'}
              format={(p) => `${p}%`}
              strokeColor={collectionRate >= 80 ? '#52c41a' : collectionRate >= 50 ? '#1890ff' : '#f5222d'}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: '#8c8c8c' }}>
              已收 {formatCurrency(data.invoices.totalPaid)} / {formatCurrency(data.invoices.totalAmount)}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第三行：图表 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={10}>
          <Card title="业务状态分布" extra={<a onClick={() => navigate('/matters')}>查看全部</a>}>
            {matterPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={matterPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    outerRadius={80}
                    label={(e: any) => `${e.name}: ${e.value}`}
                  >
                    {matterPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无业务数据" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={7}>
          <Card title="任务状态" extra={<a onClick={() => navigate('/tasks')}>查看全部</a>}>
            {taskBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={taskBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <RTooltip />
                  <Bar dataKey="count" fill="#1890ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无任务数据" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={7}>
          <Card title="发票金额统计" extra={<a onClick={() => navigate('/invoices')}>查看全部</a>}>
            {invoiceBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={invoiceBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={12} />
                  <RTooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  <Bar dataKey="amount" fill="#52c41a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无发票数据" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 第四行：逾期任务 + 近期业务 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<Space><ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />逾期任务</Space>}
            extra={<a onClick={() => navigate('/tasks')}>查看全部</a>}
          >
            {data.tasks.overdueTasks.length > 0 ? (
              <List
                dataSource={data.tasks.overdueTasks}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{item.title}</Text>
                          <Tag color={priorityColors[item.priority]}>{priorityLabels[item.priority]}</Tag>
                        </Space>
                      }
                      description={`${item.matter?.title || '未关联业务'} · 截止 ${new Date(item.dueDate).toLocaleDateString()}`}
                    />
                    <Tag color="error">逾期</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="🎉 无逾期任务" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="近期业务" extra={<a onClick={() => navigate('/matters')}>查看全部</a>}>
            {data.recentMatters.length > 0 ? (
              <List
                dataSource={data.recentMatters}
                renderItem={(item: any) => (
                  <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/matters/${item.id}`)}>
                    <List.Item.Meta
                      title={<Text strong>{item.matterNo} — {item.title}</Text>}
                      description={`${item.client?.name || ''} · ${item.deadline ? '截止 ' + new Date(item.deadline).toLocaleDateString() : '无截止日'}`}
                    />
                    <Tag>{matterStatusLabels[item.status] || item.status}</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无业务记录" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 第五行：即将到期业务 */}
      {data.matters.upcomingDeadlines.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card
              title={<Space><AlertOutlined style={{ color: '#faad14' }} />7天内截止业务</Space>}
            >
              <List
                dataSource={data.matters.upcomingDeadlines}
                renderItem={(item: any) => (
                  <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/matters/${item.id}`)}>
                    <List.Item.Meta
                      title={<Text strong>{item.matterNo} — {item.title}</Text>}
                      description={`${item.client?.name || ''} · 截止 ${new Date(item.deadline).toLocaleDateString()}`}
                    />
                    <Tag color="warning">即将到期</Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DashboardPage;
