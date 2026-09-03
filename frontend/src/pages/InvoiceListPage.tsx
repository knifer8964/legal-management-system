import React, { useEffect, useState } from 'react';
import {
  Card, Button, Table, Tag, Space, Typography, Modal, Form,
  Row, Col, Input, Select, DatePicker, InputNumber, message, Statistic,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, DollarOutlined, EditOutlined,
} from '@ant-design/icons';
import { Popconfirm } from 'antd';
import { useInvoiceStore } from '../stores/invoiceStore';
import { useClientStore } from '../stores/clientStore';
import { useMatterStore } from '../stores/matterStore';
import { Invoice, CreateInvoiceDto, Client, Matter, InvoiceStatus } from '../types/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_CONFIG: Record<InvoiceStatus, { color: string; label: string }> = {
  DRAFT: { color: 'default', label: '草稿' },
  ISSUED: { color: 'blue', label: '已开具' },
  SENT: { color: 'cyan', label: '已发送' },
  PARTIAL: { color: 'orange', label: '部分支付' },
  PAID: { color: 'green', label: '已支付' },
  OVERDUE: { color: 'red', label: '逾期' },
  CANCELLED: { color: 'default', label: '已取消' },
};

const InvoiceListPage: React.FC = () => {
  const { invoices, pagination, fetchInvoices, createInvoice, deleteInvoice, updateInvoice, recordPayment } = useInvoiceStore();
  const { clients, fetchClients } = useClientStore();
  const { matters, fetchMatters } = useMatterStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [payForm] = Form.useForm();

  useEffect(() => {
    fetchClients({ page: 1, pageSize: 100 });
    fetchMatters({ page: 1, pageSize: 100 });
    fetchInvoices({ page: 1, pageSize: 20 });
  }, []);

  const totalAmount = invoices.reduce((s, inv) => s + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((s, inv) => s + inv.paidAmount, 0);
  const totalUnpaid = totalAmount - totalPaid;

  const handleCreate = async (values: any) => {
    try {
      const data: CreateInvoiceDto = {
        clientId: values.clientId,
        matterId: values.matterId,
        subtotal: values.subtotal,
        taxRate: values.taxRate || 0,
        discount: values.discount || 0,
        status: values.status || 'DRAFT',
        issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : undefined,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
        notes: values.notes,
      };
      await createInvoice(data);
      message.success('发票创建成功');
      setIsModalOpen(false);
      form.resetFields();
    } catch (e: any) {
      message.error(e.response?.data?.message || e.message || '创建失败');
    }
  };

  const handleEdit = async (values: any) => {
    if (!editingInvoice) return;
    try {
      await updateInvoice(editingInvoice.id, {
        clientId: values.clientId,
        matterId: values.matterId,
        subtotal: values.subtotal,
        taxRate: values.taxRate || 0,
        discount: values.discount || 0,
        status: values.status,
        issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : undefined,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
        notes: values.notes,
      });
      message.success('更新成功');
      setIsEditModalOpen(false);
      setEditingInvoice(null);
      editForm.resetFields();
    } catch (e: any) {
      message.error(e.response?.data?.message || e.message || '更新失败');
    }
  };

  const handlePay = async (values: any) => {
    if (!payingInvoice) return;
    try {
      await recordPayment(payingInvoice.id, values.amount);
      message.success('支付记录成功');
      setIsPayModalOpen(false);
      setPayingInvoice(null);
      payForm.resetFields();
    } catch (e: any) {
      message.error(e.response?.data?.message || e.message || '支付失败');
    }
  };

  const openEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    editForm.setFieldsValue({
      clientId: invoice.clientId,
      matterId: invoice.matterId,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      discount: invoice.discount,
      status: invoice.status,
      issueDate: invoice.issueDate ? dayjs(invoice.issueDate) : undefined,
      dueDate: invoice.dueDate ? dayjs(invoice.dueDate) : undefined,
      notes: invoice.notes,
    });
    setIsEditModalOpen(true);
  };

  const openPay = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    payForm.setFieldsValue({ amount: invoice.totalAmount - invoice.paidAmount });
    setIsPayModalOpen(true);
  };

  const columns = [
    { title: '发票号', dataIndex: 'invoiceNo', render: (v: string) => <Text strong>{v}</Text> },
    { title: '客户', dataIndex: ['client', 'name'], render: (_: any, r: Invoice) => r.client?.name || '-' },
    { title: '业务', dataIndex: ['matter', 'title'], render: (_: any, r: Invoice) => r.matter?.title || '-' },
    { title: '小计', dataIndex: 'subtotal', render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '税额', dataIndex: 'taxAmount', render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '总额', dataIndex: 'totalAmount', render: (v: number) => <Text strong>¥{v.toFixed(2)}</Text> },
    { title: '已付', dataIndex: 'paidAmount', render: (v: number) => v > 0 ? <Text type="success">¥{v.toFixed(2)}</Text> : '-' },
    {
      title: '状态', dataIndex: 'status',
      render: (v: InvoiceStatus) => {
        const cfg = STATUS_CONFIG[v] || { color: 'default', label: v };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: '开具日期', dataIndex: 'issueDate', render: (v: string | null) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { title: '到期日', dataIndex: 'dueDate', render: (v: string | null) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    {
      title: '操作', key: 'action', width: 180,
      render: (_: any, r: Invoice) => (
        <Space size="small">
          <Button size="small" type="link" icon={<DollarOutlined />}
            disabled={r.status === 'PAID' || r.status === 'CANCELLED'}
            onClick={() => openPay(r)}>付款</Button>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title="确认删除"
            description="确定要删除这张发票吗？"
            onConfirm={() => { deleteInvoice(r.id); message.success('已删除'); }}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>发票管理</Title>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Statistic title="发票数" value={invoices.length} /></Col>
        <Col xs={12} md={6}><Statistic title="总金额" value={`¥${totalAmount.toFixed(2)}`} /></Col>
        <Col xs={12} md={6}><Statistic title="已收" value={`¥${totalPaid.toFixed(2)}`} valueStyle={{ color: '#3f8600' }} /></Col>
        <Col xs={12} md={6}><Statistic title="未收" value={`¥${totalUnpaid.toFixed(2)}`} valueStyle={{ color: '#cf1322' }} /></Col>
      </Row>

      {/* 操作栏 */}
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>新建发票</Button>
      </div>

      {/* 发票列表 */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={invoices}
        loading={false}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => fetchInvoices({ page, pageSize }),
        }}
      />

      {/* 创建发票弹窗 */}
      <Modal
        title="新建发票"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="clientId" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
            <Select showSearch optionFilterProp="children" placeholder="选择客户">
              {clients.map((c: Client) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="matterId" label="关联业务">
            <Select showSearch optionFilterProp="children" allowClear placeholder="选择业务（可选）">
              {matters.map((m: Matter) => <Option key={m.id} value={m.id}>{m.matterNo} - {m.title}</Option>)}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="subtotal" label="小计金额" rules={[{ required: true, message: '请输入金额' }]}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="taxRate" label="税率(%)" initialValue={0}>
                <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discount" label="折扣" initialValue={0}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="状态" initialValue="DRAFT">
                <Select>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <Option key={k} value={k}>{v.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="issueDate" label="开具日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dueDate" label="到期日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="发票备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑发票弹窗 */}
      <Modal
        title="编辑发票"
        open={isEditModalOpen}
        onOk={() => editForm.submit()}
        onCancel={() => { setIsEditModalOpen(false); setEditingInvoice(null); }}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="clientId" label="客户" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {clients.map((c: Client) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="matterId" label="关联业务">
            <Select showSearch optionFilterProp="children" allowClear>
              {matters.map((m: Matter) => <Option key={m.id} value={m.id}>{m.matterNo} - {m.title}</Option>)}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="subtotal" label="小计金额" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="taxRate" label="税率(%)">
                <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discount" label="折扣">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="状态">
                <Select>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <Option key={k} value={k}>{v.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="issueDate" label="开具日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dueDate" label="到期日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 支付弹窗 */}
      <Modal
        title="记录支付"
        open={isPayModalOpen}
        onOk={() => payForm.submit()}
        onCancel={() => { setIsPayModalOpen(false); setPayingInvoice(null); }}
      >
        {payingInvoice && (
          <div style={{ marginBottom: 16 }}>
            <Text>发票号: <Text strong>{payingInvoice.invoiceNo}</Text></Text><br />
            <Text>总额: <Text strong>¥{payingInvoice.totalAmount.toFixed(2)}</Text></Text><br />
            <Text>已付: <Text type="success">¥{payingInvoice.paidAmount.toFixed(2)}</Text></Text><br />
            <Text>待付: <Text type="danger">¥{(payingInvoice.totalAmount - payingInvoice.paidAmount).toFixed(2)}</Text></Text>
          </div>
        )}
        <Form form={payForm} layout="vertical" onFinish={handlePay}>
          <Form.Item name="amount" label="支付金额" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0.01} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoiceListPage;
