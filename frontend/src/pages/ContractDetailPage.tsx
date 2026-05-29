import React, { useEffect, useState } from 'react';
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
  Select,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import useContractStore from '../../stores/contractStore';
import contractService from '../../services/contract';
import { Contract, ContractStatus, ApprovalRecord } from '../../types/api';

const { TextArea } = Input;

const ContractDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveAction, setApproveAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [approvers, setApprovers] = useState<any[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<number[]>([]);
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

  const handleSubmitClick = async () => {
    try {
      const list = await contractService.getApprovers();
      setApprovers(list);
      setSubmitModalVisible(true);
    } catch {
      message.error('获取审批人列表失败');
    }
  };

  const handleSubmitConfirm = async () => {
    if (!id || selectedApprovers.length === 0) {
      message.warning('请选择至少一位审批人');
      return;
    }
    try {
      await submitContract(id, selectedApprovers);
      message.success('提交审批成功');
      setSubmitModalVisible(false);
      setSelectedApprovers([]);
      fetchContractById(id);
    } catch (error: any) {
      message.error(error.message || '提交审批失败');
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
      message.error(error.message || '审批失败');
    }
  };

  const getStatusColor = (status: ContractStatus) => {
    const colorMap: Record<ContractStatus, string> = {
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
    const textMap: Record<ContractStatus, string> = {
      [ContractStatus.DRAFT]: '草稿',
      [ContractStatus.REVIEWING]: '审批中',
      [ContractStatus.SIGNED]: '已签署',
      [ContractStatus.EXECUTING]: '履行中',
      [ContractStatus.COMPLETED]: '已完成',
      [ContractStatus.TERMINATED]: '已终止',
    };
    return textMap[status] || status;
  };

  const getApprovalStatusText = (status: string) => {
    const map: Record<string, string> = {
      PENDING: '待审批',
      APPROVED: '已通过',
      REJECTED: '已拒绝',
    };
    return map[status] || status;
  };

  const getApprovalStatusColor = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'processing',
      APPROVED: 'success',
      REJECTED: 'error',
    };
    return map[status] || 'default';
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
                onClick={handleSubmitClick}
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
          {contract.amount != null ? `¥${contract.amount.toLocaleString()}` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="签署日期">{contract.signDate || '-'}</Descriptions.Item>
        <Descriptions.Item label="生效日期">{contract.effectiveDate || '-'}</Descriptions.Item>
        <Descriptions.Item label="到期日期">{contract.expiryDate || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{contract.createdAt}</Descriptions.Item>
        <Descriptions.Item label="创建人">{contract.creator?.realName || '-'}</Descriptions.Item>
        <Descriptions.Item label="合同内容" span={2}>
          {contract.content || '-'}
        </Descriptions.Item>
      </Descriptions>

      {/* 审批流程 */}
      <Card title="审批流程" style={{ marginTop: 24 }} size="small">
        <Timeline
          items={[
            {
              color: 'green',
              children: `创建合同 - ${contract.creator?.realName || '未知'} 于 ${contract.createdAt}`,
            },
            ...(contract.approvals || []).map((approval: ApprovalRecord) => ({
              color: approval.status === 'APPROVED' ? 'green' : approval.status === 'REJECTED' ? 'red' : 'blue',
              children: (
                <span>
                  {approval.approver?.realName || '审批人'} - 
                  <Tag color={getApprovalStatusColor(approval.status)} style={{ marginLeft: 4 }}>
                    {getApprovalStatusText(approval.status)}
                  </Tag>
                  {approval.comment && <span style={{ marginLeft: 8, color: '#666' }}>{approval.comment}</span>}
                  {approval.approvedAt && <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>{approval.approvedAt}</span>}
                </span>
              ),
            })),
          ]}
        />
      </Card>

      {/* 提交审批弹窗 */}
      <Modal
        title="提交审批"
        open={submitModalVisible}
        onOk={handleSubmitConfirm}
        onCancel={() => { setSubmitModalVisible(false); setSelectedApprovers([]); }}
        okText="确认提交"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>请选择审批人：</div>
        <Select
          mode="multiple"
          placeholder="选择审批人"
          value={selectedApprovers}
          onChange={setSelectedApprovers}
          style={{ width: '100%' }}
          options={approvers.map(a => ({ label: `${a.realName} (${a.username})`, value: a.id }))}
        />
      </Modal>

      {/* 审批操作弹窗 */}
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
            rules={approveAction === 'REJECTED' ? [{ required: true, message: '拒绝时请填写原因' }] : []}
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
