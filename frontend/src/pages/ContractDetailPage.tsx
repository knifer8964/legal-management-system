import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Timeline,
  Modal,
  Form,
  Input,
  message,
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import useContractStore from '../../stores/contractStore';
import { Contract, ContractStatus, ApproveRequest } from '../../types/api';

const { TextArea } = Input;

const ContractDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [approveModalVisible, setApproveModalVisible] = React.useState(false);
  const [approveAction, setApproveAction] = React.useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [form] = Form.useForm();

  const {
    currentContract: contract,
    loading,
    fetchContractById,
    submitContract,
    approveContract,
    clearCurrentContract,
  } = useContractStore();

  useEffect(() => {
    if (id) {
      fetchContractById(id);
    }
    return () => {
      clearCurrentContract();
    };
  }, [id]);

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await submitContract(id);
      message.success('提交审批成功');
      fetchContractById(id);
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleApprove = async (values: { comment: string }) => {
    if (!id) return;
    try {
      await approveContract(id, approveAction, values.comment);
      message.success(approveAction === 'APPROVED' ? '审批通过' : '审批拒绝');
      setApproveModalVisible(false);
      form.resetFields();
      fetchContractById(id);
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

  if (loading || !contract) {
    return (
      <Card>
        <Spin size="large" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/contracts')}
          />
          合同详情
        </Space>
      }
      extra={
        <Space>
          {contract.status === ContractStatus.DRAFT && (
            <>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/contracts/${id}/edit`)}
              >
                编辑
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
              >
                提交审批
              </Button>
            </>
          )}
          {contract.status === ContractStatus.REVIEWING && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setApproveAction('APPROVED');
                  setApproveModalVisible(true);
                }}
              >
                通过
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setApproveAction('REJECTED');
                  setApproveModalVisible(true);
                }}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      }
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="合同编号">{contract.contractNo}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={getStatusColor(contract.status)}>
            {getStatusText(contract.status)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="标题" span={2}>
          {contract.title}
        </Descriptions.Item>
        <Descriptions.Item label="甲方">{contract.partyA}</Descriptions.Item>
        <Descriptions.Item label="乙方">{contract.partyB}</Descriptions.Item>
        <Descriptions.Item label="合同类型">{contract.contractType}</Descriptions.Item>
        <Descriptions.Item label="合同金额">
          ¥{contract.amount.toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="签署日期">{contract.signDate}</Descriptions.Item>
        <Descriptions.Item label="生效日期">{contract.effectiveDate}</Descriptions.Item>
        <Descriptions.Item label="到期日期">{contract.expiryDate}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{contract.createdAt}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{contract.updatedAt}</Descriptions.Item>
        <Descriptions.Item label="合同内容" span={2}>
          {contract.content}
        </Descriptions.Item>
      </Descriptions>

      <Card
        title="审批流程"
        style={{ marginTop: 24 }}
        size="small"
      >
        <Timeline
          items={[
            {
              children: `创建合同 - ${contract.createdAt}`,
            },
            ...(contract.status !== ContractStatus.DRAFT
              ? [
                  {
                    children: `提交审批 - TODO: 从API获取审批记录`,
                  },
                ]
              : []),
            ...(contract.status === ContractStatus.SIGNED ||
            contract.status === ContractStatus.EXECUTING ||
            contract.status === ContractStatus.COMPLETED
              ? [
                  {
                    children: `审批通过 - TODO: 从API获取审批记录`,
                  },
                  {
                    children: `合同签署 - ${contract.signDate}`,
                  },
                ]
              : []),
          ]}
        />
      </Card>

      <Modal
        title={approveAction === 'APPROVED' ? '审批通过' : '审批拒绝'}
        open={approveModalVisible}
        onCancel={() => {
          setApproveModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleApprove}>
          <Form.Item
            name="comment"
            label="审批意见"
            rules={[{ required: true, message: '请输入审批意见' }]}
          >
            <TextArea rows={4} placeholder="请输入审批意见" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认
              </Button>
              <Button
                onClick={() => {
                  setApproveModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ContractDetailPage;
