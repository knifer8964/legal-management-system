import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import useContractStore from '../../stores/contractStore';
import { ContractStatus } from '../../types/api';
import { useEffect } from 'react';

const DashboardPage: React.FC = () => {
  const { contracts, fetchContracts, loading } = useContractStore();

  useEffect(() => {
    fetchContracts({ page: 1, pageSize: 5 });
  }, []);

  const mockStats = {
    total: 156,
    draft: 23,
    reviewing: 12,
    signed: 89,
    executing: 32,
  };

  const recentContracts = contracts.slice(0, 5).map(c => ({
    key: c.id,
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
      render: (status: ContractStatus) => {
        const statusMap: Record<ContractStatus, { color: string; text: string }> = {
          [ContractStatus.DRAFT]: { color: 'default', text: '草稿' },
          [ContractStatus.REVIEWING]: { color: 'processing', text: '审批中' },
          [ContractStatus.SIGNED]: { color: 'success', text: '已签署' },
          [ContractStatus.EXECUTING]: { color: 'warning', text: '履行中' },
          [ContractStatus.COMPLETED]: { color: 'success', text: '已完成' },
          [ContractStatus.TERMINATED]: { color: 'error', text: '已终止' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '签署日期',
      dataIndex: 'signDate',
      key: 'signDate',
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>仪表盘</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="合同总数"
              value={mockStats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="草稿"
              value={mockStats.draft}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="审批中"
              value={mockStats.reviewing}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已签署"
              value={mockStats.signed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近合同" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={recentContracts}
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
