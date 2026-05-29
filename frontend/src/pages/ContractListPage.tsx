import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Tag,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import useContractStore from '../../stores/contractStore';
import { Contract, ContractStatus } from '../../types/api';

const { Search } = Input;

const ContractListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    contracts,
    total,
    loading,
    fetchContracts,
    submitContract,
  } = useContractStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ContractStatus | undefined>();

  useEffect(() => {
    loadContracts();
  }, [page, pageSize, status]);

  const loadContracts = () => {
    fetchContracts({
      page,
      pageSize,
      keyword: keyword || undefined,
      status,
    });
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
    fetchContracts({
      page: 1,
      pageSize,
      keyword: value || undefined,
      status,
    });
  };

  const handleStatusChange = (value: ContractStatus | undefined) => {
    setStatus(value);
    setPage(1);
  };

  const handleSubmit = async (id: string) => {
    try {
      await submitContract(id);
      message.success('提交审批成功');
      loadContracts();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const getStatusColor = (status: ContractStatus) => {
    const colorMap = {
      [ContractStatus.DRAFT]: 'default',
      [ContractStatus.REVIEWING]: 'processing',
      [ContractStatus.SIGNED]: 'success',
      [ContractStatus.EXECUTING]: 'warning',
      [ContractStatus.COMPLETED]: 'success',
      [ContractStatus.TERMINATED]: 'error',
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: ContractStatus) => {
    const textMap = {
      [ContractStatus.DRAFT]: '草稿',
      [ContractStatus.REVIEWING]: '审批中',
      [ContractStatus.SIGNED]: '已签署',
      [ContractStatus.EXECUTING]: '履行中',
      [ContractStatus.COMPLETED]: '已完成',
      [ContractStatus.TERMINATED]: '已终止',
    };
    return textMap[status] || status;
  };

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'contractNo',
      key: 'contractNo',
      width: 150,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '甲方',
      dataIndex: 'partyA',
      key: 'partyA',
      width: 150,
      ellipsis: true,
    },
    {
      title: '乙方',
      dataIndex: 'partyB',
      key: 'partyB',
      width: 150,
      ellipsis: true,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ContractStatus) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '签署日期',
      dataIndex: 'signDate',
      key: 'signDate',
      width: 120,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: Contract) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/contracts/${record.id}`)}
          >
            查看
          </Button>
          {record.status === ContractStatus.DRAFT && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/contracts/${record.id}/edit`)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定提交审批？"
                onConfirm={() => handleSubmit(record.id)}
              >
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                >
                  提交
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="合同管理"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/contracts/create')}
        >
          新建合同
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }} size="middle">
        <Search
          placeholder="搜索合同标题、编号..."
          onSearch={handleSearch}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="合同状态"
          value={status}
          onChange={handleStatusChange}
          allowClear
          style={{ width: 150 }}
        >
          {Object.values(ContractStatus).map((s) => (
            <Select.Option key={s} value={s}>
              {getStatusText(s)}
            </Select.Option>
          ))}
        </Select>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={contracts}
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />
    </Card>
  );
};

export default ContractListPage;
