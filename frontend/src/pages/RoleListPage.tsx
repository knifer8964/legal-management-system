import React, { useEffect, useState } from 'react';
import {
  Table, Card, Button, Input, Space, Tag, Modal, Form,
  Row, Col, message, Popconfirm, Typography, Checkbox, Divider,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useRoleStore } from '../stores/roleStore';
import { Role, User } from '../types/api';

const { Title } = Typography;

// 权限模块定义
const PERMISSION_MODULES: { module: string; label: string }[] = [
  { module: 'client', label: '客户管理' },
  { module: 'matter', label: '业务事项' },
  { module: 'task', label: '任务管理' },
  { module: 'time', label: '计时收费' },
  { module: 'invoice', label: '发票管理' },
  { module: 'communication', label: '沟通记录' },
  { module: 'document', label: '文档管理' },
  { module: 'role', label: '角色管理' },
  { module: 'user', label: '用户管理' },
  { module: 'report', label: '报表统计' },
  { module: 'settings', label: '系统设置' },
];

const PERMISSION_ACTIONS: { action: string; label: string }[] = [
  { action: 'read', label: '查看' },
  { action: 'write', label: '写入' },
  { action: 'delete', label: '删除' },
];

const RoleListPage: React.FC = () => {
  const {
    roles, loading, pagination,
    fetchRoles, createRole, updateRole, deleteRole, fetchRoleUsers,
  } = useRoleStore();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isUsersModal, setIsUsersModal] = useState(false);
  const [roleUsers, setRoleUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRoles({ page: 1, pageSize: 10, keyword: search });
  }, [search]);

  const loadPage = (page: number, pageSize: number) => {
    fetchRoles({ page, pageSize, keyword: search });
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        roleName: values.roleName,
        description: values.description,
        permissions: values.permissions || [],
      };
      if (editingRole) {
        await updateRole(editingRole.id, payload);
        message.success('角色更新成功');
      } else {
        await createRole(payload);
        message.success('角色创建成功');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingRole(null);
    } catch (e: any) {
      message.error(e.response?.data?.error?.message || e.message || '操作失败');
    }
  };

  const openCreate = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({ permissions: [] });
    setIsModalOpen(true);
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    form.setFieldsValue({
      roleName: role.roleName,
      description: role.description,
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      message.success('角色已删除');
    } catch (e: any) {
      message.error(e.response?.data?.error?.message || e.message || '删除失败');
    }
  };

  const openUsers = async (role: any) => {
    setUsersLoading(true);
    setIsUsersModal(true);
    try {
      const users = await fetchRoleUsers(role.id);
      setRoleUsers(users);
    } catch (e: any) {
      message.error(e.response?.data?.error?.message || e.message || '获取用户失败');
      setRoleUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const renderPermissions = (permissions: any) => {
    if (!permissions) return <span>-</span>;
    if (Array.isArray(permissions) && permissions.includes('*')) {
      return <Tag color="gold">全部权限</Tag>;
    }
    if (Array.isArray(permissions)) {
      if (permissions.length === 0) return <span>-</span>;
      return (
        <Space size={[4, 4]} wrap>
          {permissions.slice(0, 5).map((p: string) => (
            <Tag key={p} color="blue">{p}</Tag>
          ))}
          {permissions.length > 5 && <Tag>+{permissions.length - 5}</Tag>}
        </Space>
      );
    }
    return <span>-</span>;
  };

  const columns = [
    {
      title: 'ID', dataIndex: 'id', width: 60,
    },
    {
      title: '角色名称', dataIndex: 'roleName', width: 140,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: '描述', dataIndex: 'description', width: 220,
      render: (v: string | null) => v || '-',
    },
    {
      title: '权限', dataIndex: 'permissions', width: 280,
      render: renderPermissions,
    },
    {
      title: '用户数', dataIndex: '_count', width: 80,
      render: (v: any) => (v && typeof v.users === 'number') ? v.users : 0,
    },
    {
      title: '创建时间', dataIndex: 'createdAt', width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', key: 'actions', width: 220, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<TeamOutlined />} onClick={() => openUsers(record)}>
            查看用户
          </Button>
          <Popconfirm
            title="确定要删除该角色吗？"
            description="仍有用户关联的角色无法删除"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const userColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'realName' },
    { title: '邮箱', dataIndex: 'email', render: (v: string | null) => v || '-' },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag>{v}</Tag> },
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>角色管理</Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="搜索角色名称/描述"
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                新增角色
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => loadPage(page, pageSize),
          }}
        />
      </Card>

      {/* 创建/编辑角色 Modal */}
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); setEditingRole(null); }}
        footer={null}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="roleName"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }, { min: 2, message: '至少2个字符' }]}
          >
            <Input placeholder="请输入角色名称，如 MANAGER" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="请输入角色描述" />
          </Form.Item>
          <Form.Item name="permissions" label="权限">
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }} size={0}>
                <Checkbox value="*">全部权限（管理员）</Checkbox>
                <Divider style={{ margin: '8px 0' }} />
                {PERMISSION_MODULES.map((m) => (
                  <div key={m.module} style={{ padding: '2px 0' }}>
                    <span style={{ display: 'inline-block', width: 80, fontWeight: 500 }}>{m.label}</span>
                    {PERMISSION_ACTIONS.map((a) => (
                      <Checkbox key={a.action} value={`${m.module}:${a.action}`} style={{ marginRight: 12 }}>
                        {a.label}
                      </Checkbox>
                    ))}
                  </div>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => { setIsModalOpen(false); form.resetFields(); setEditingRole(null); }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingRole ? '保存' : '创建'}
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* 角色用户列表 Modal */}
      <Modal
        title="角色下的用户"
        open={isUsersModal}
        onCancel={() => { setIsUsersModal(false); setRoleUsers([]); }}
        footer={null}
        width={600}
      >
        <Table
          columns={userColumns}
          dataSource={roleUsers}
          rowKey="id"
          loading={usersLoading}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default RoleListPage;
