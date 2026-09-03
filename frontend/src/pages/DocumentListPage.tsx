import React, { useEffect, useState } from 'react';
import {
  Card, Button, Table, Tag, Space, Typography, Modal, Form,
  Row, Col, Input, Select, message, Statistic, Popconfirm, Upload,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, FileOutlined,
  SearchOutlined, DownloadOutlined, InboxOutlined,
} from '@ant-design/icons';
import { useDocumentStore } from '../stores/documentStore';
import { useClientStore } from '../stores/clientStore';
import { useMatterStore } from '../stores/matterStore';
import { Document, Client, Matter } from '../types/api';
import type { UploadFile } from 'antd';
import { documentService } from '../services/documentService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  CONTRACT: { color: 'blue', label: '合同' },
  EVIDENCE: { color: 'orange', label: '证据' },
  DELIVERABLE: { color: 'green', label: '成果' },
  TEMPLATE: { color: 'purple', label: '模板' },
  OTHER: { color: 'default', label: '其他' },
};

// 文件大小人类可读格式化
function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

const DocumentListPage: React.FC = () => {
  const {
    documents, pagination, loading, stats,
    fetchDocuments, fetchStats, uploadDocument, updateDocument, deleteDocument,
  } = useDocumentStore();
  const { clients, fetchClients } = useClientStore();
  const { matters, fetchMatters } = useMatterStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchClients({ page: 1, pageSize: 100 });
    fetchMatters({ page: 1, pageSize: 100 });
    fetchDocuments({ page: 1, pageSize: 20 });
    fetchStats();
  }, []);

  const doSearch = () => {
    fetchDocuments({ page: 1, pageSize: pagination.pageSize, search: search || undefined, category: categoryFilter });
  };

  const handleCreate = async (values: any) => {
    if (!fileList.length) {
      message.error('请选择要上传的文件');
      return;
    }
    try {
      const formData = new FormData();
      const rawFile = (fileList[0] as any)?.originFileObj || (fileList[0] as any);
      formData.append('file', rawFile);
      if (values.clientId !== undefined && values.clientId !== null) {
        formData.append('clientId', String(values.clientId));
      }
      if (values.matterId !== undefined && values.matterId !== null) {
        formData.append('matterId', String(values.matterId));
      }
      if (values.category) formData.append('category', values.category);
      if (values.tags) formData.append('tags', values.tags);
      if (values.description) formData.append('description', values.description);

      setUploading(true);
      await uploadDocument(formData);
      message.success('文档上传成功');
      setUploading(false);
      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);
      fetchStats();
      fetchDocuments({ page: 1, pageSize: pagination.pageSize });
    } catch (e: any) {
      setUploading(false);
      message.error(e.response?.data?.error?.message || e.response?.data?.message || e.message || '上传失败');
    }
  };

  const handleEdit = async (values: any) => {
    if (!editingDoc) return;
    try {
      await updateDocument(editingDoc.id, {
        clientId: values.clientId,
        matterId: values.matterId,
        category: values.category,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
        description: values.description,
      });
      message.success('更新成功');
      setIsEditModalOpen(false);
      setEditingDoc(null);
      editForm.resetFields();
      fetchStats();
    } catch (e: any) {
      message.error(e.response?.data?.error?.message || e.response?.data?.message || e.message || '更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDocument(id);
      message.success('已删除');
      fetchStats();
      fetchDocuments({ page: pagination.page, pageSize: pagination.pageSize });
    } catch (e: any) {
      message.error(e.response?.data?.error?.message || e.response?.data?.message || e.message || '删除失败');
    }
  };

  const openEdit = (doc: Document) => {
    setEditingDoc(doc);
    editForm.setFieldsValue({
      clientId: doc.clientId,
      matterId: doc.matterId,
      category: doc.category,
      tags: Array.isArray(doc.tags) ? doc.tags.join(', ') : '',
      description: doc.description,
    });
    setIsEditModalOpen(true);
  };

  const handleDownload = async (doc: Document) => {
    try {
      await documentService.download(doc.id, doc.originalName || doc.fileName);
    } catch (e: any) {
      message.error(e.message || '下载失败');
    }
  };

  const columns = [
    {
      title: '文件名', dataIndex: 'fileName',
      render: (v: string) => (
        <Space>
          <FileOutlined style={{ color: '#8c8c8c' }} />
          <Text strong>{v}</Text>
        </Space>
      ),
    },
    { title: '原始名称', dataIndex: 'originalName', ellipsis: true },
    { title: '大小', dataIndex: 'fileSize', render: (v: number) => formatFileSize(v) },
    { title: '类型', dataIndex: 'mimeType', render: (v: string) => <Text type="secondary">{v || '-'}</Text> },
    {
      title: '分类', dataIndex: 'category',
      render: (v: string | null) => {
        if (!v) return <Tag>未分类</Tag>;
        const cfg = CATEGORY_CONFIG[v] || { color: 'default', label: v };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: '客户', dataIndex: ['client', 'name'], render: (_: any, r: Document) => r.client?.name || '-' },
    { title: '业务', dataIndex: ['matter', 'title'], render: (_: any, r: Document) => r.matter?.title || '-' },
    { title: '上传时间', dataIndex: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 170,
      render: (_: any, r: Document) => (
        <Space size="small">
          <Button size="small" type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(r)}>下载</Button>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm
            title="确定删除该文档？"
            description="删除后不可恢复"
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => handleDelete(r.id)}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalSizeText = stats ? formatFileSize(stats.totalSize) : '-';

  return (
    <div>
      <Title level={4}>文档管理</Title>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="文档总数" value={stats ? stats.totalDocuments : 0} prefix={<FileOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="总占用空间" value={totalSizeText} />
          </Card>
        </Col>
        {stats && Object.entries(stats.categoryBreakdown || {}).map(([cat, v]) => {
          const cfg = CATEGORY_CONFIG[cat] || { color: 'default', label: cat === 'UNCATEGORIZED' ? '未分类' : cat };
          return (
            <Col xs={12} md={3} key={cat}>
              <Card>
                <Statistic
                  title={<Tag color={cfg.color}>{cfg.label}</Tag>}
                  value={v.count}
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* 操作栏 + 搜索 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>上传文档</Button>
        </Space>
        <Space>
          <Select
            allowClear
            placeholder="分类筛选"
            style={{ width: 140 }}
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); fetchDocuments({ page: 1, pageSize: pagination.pageSize, category: v, search: search || undefined }); }}
          >
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
          </Select>
          <Input
            placeholder="搜索文件名/描述/客户/业务"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={search}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={doSearch}
          />
          <Button type="primary" onClick={doSearch}>搜索</Button>
        </Space>
      </div>

      {/* 文档列表 */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={documents}
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => fetchDocuments({ page, pageSize, search: search || undefined, category: categoryFilter }),
        }}
      />

      {/* 上传文档弹窗 */}
      <Modal
        title="上传文档"
        open={isModalOpen}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); setFileList([]); }}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="file" label="文件" rules={[{ required: true, message: '请选择要上传的文件' }]}>
            <Dragger
              fileList={fileList}
              maxCount={1}
              beforeUpload={(file) => {
                setFileList([file]);
                return false;
              }}
              onRemove={() => setFileList([])}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">支持 PDF、Word、Excel、PPT、文本等文档，单个文件不超过 50MB</p>
            </Dragger>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="clientId" label="关联客户">
                <Select allowClear showSearch optionFilterProp="children" placeholder="选择客户（可选）">
                  {clients.map((c: Client) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="matterId" label="关联业务">
                <Select allowClear showSearch optionFilterProp="children" placeholder="选择业务（可选）">
                  {matters.map((m: Matter) => <Option key={m.id} value={m.id}>{m.matterNo} - {m.title}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Select allowClear placeholder="选择分类">
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签">
                <Input placeholder="逗号分隔，如：合同, 2024" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="文档描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑文档弹窗 */}
      <Modal
        title="编辑文档"
        open={isEditModalOpen}
        onOk={() => editForm.submit()}
        onCancel={() => { setIsEditModalOpen(false); setEditingDoc(null); }}
        width={560}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="clientId" label="关联客户">
                <Select allowClear showSearch optionFilterProp="children" placeholder="选择客户（可选）">
                  {clients.map((c: Client) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="matterId" label="关联业务">
                <Select allowClear showSearch optionFilterProp="children" placeholder="选择业务（可选）">
                  {matters.map((m: Matter) => <Option key={m.id} value={m.id}>{m.matterNo} - {m.title}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Select allowClear placeholder="选择分类">
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签">
                <Input placeholder="逗号分隔" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="文档描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentListPage;
