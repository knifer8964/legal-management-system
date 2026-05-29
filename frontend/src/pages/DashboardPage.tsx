import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Spin } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  UserOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { getDashboardStats } from '../services/dashboardService';
import { DashboardStats, ContractStatus } from '../../types/api';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewContracts = () => {
    navigate('/contracts');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  const contractStats = stats?.contractStats || {
    total: 0,
    draft: 0,
    reviewing: 0,
    signed: 0,
    executing: 0,
    completed: 0,
  };

  const statusColorMap: Record<string, string> = {
    DRAFT: 'default',
    REVIEWING: 'processing',
    SIGNED: 'success',
    EXECUTING: 'warning',
    COMPLETED: 'success',
    TERMINATED: 'error',
  };

  const statusTextMap: Record<string, string> = {
    DRAFT: '草稿',
    REVIEWING: '审批中',
    SIGNED: '已签署',
    EXECUTING: '履行中',
    COMPLETED: '已完成',
    TERMINATED: '已终止',
  };

  const recentContracts = stats?.recentContracts || [];
  const recentContractsFormatted = recentContracts.map((c, idx) => ({
    key: c.id || idx,
    contractNo: c.contractNo,
    title: c.title,
    status: c.status,
    amount: c.amount,
    signDate: c.signDate,
  }));

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'contractNo',
      key: 'contractNo',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'}>
          {statusTextMap[status] || status}
        </Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount ? `¥${amount.toLocaleString()}` : '-',
    },
    {
      title: '签署日期',
      dataIndex: 'signDate',
      key: 'signDate',
      render: (date: string) => date || '-',
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>仪表盘</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable onClick={handleViewContracts} style={{ cursor: 'pointer' }}>
            <Statistic
              title="合同总数"
              value={contractStats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="草稿"
              value={contractStats.draft}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="审批中"
              value={contractStats.reviewing}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已签署"
              value={contractStats.signed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="用户总数"
              value={stats?.userStats?.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="案件总数"
              value={stats?.caseStats?.total || 0}
              prefix={<AuditOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="本月新增合同"
              value={stats?.monthlyNewContracts || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近合同" extra={
        <a onClick={handleViewContracts} style={{ cursor: 'pointer' }}>查看全部</a>
      } style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={recentContractsFormatted}
          pagination={false}
          size="small"
          locale={{ emptyText: '暂无合同数据' }}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;