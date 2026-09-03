import React, { useEffect, useState } from 'react';
import {
  Table, Card, Button, Input, Space, Tag, Modal, Form,
  Row, Col, message, Popconfirm, Typography, Select,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, KeyOutlined,
} from '@ant-design/icons';
import userStore from '../stores/userStore';
import { User, UserStatus } from '../types/api';

const { Title } = Typography;
const { Option } = Select;

const statusLabels: Record<string, string> = {
  ACTIVE: '正常', INACTIVE: '已停用', LOCKED: '已锁定',
};
const statusColors: Record<string, string> = {
  ACTIVE: 'green', INACTIVE: 'default', LOCKED: 'red',
};

const UserListPage: React.FC = () => {
  const {
    users, roles, loading, pagination,
    fetchUsers, fetchRoles, createUser, updateUser, deleteUser, resetPassword,
  } = userStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isPasswordModal, setIsPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();

  useEffect(() => {
    fetchUsers({ page: 1, pageSize: 10, keyword: search, status: statusFilter });
    fetchRoles();
  }, [search, statusFilter]);

  const loadPage = (page: number, pageSize: number) => {
    fetchUsers({ page, pageSize, keyword: search, status: statusFilter });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          realName: values.realName,
          email: values.email,
          phone: values.phone,
          roleId: values.roleId,
          department: values.department,
          status: values.status,
        });
        message.success('用户更新成功');
      } else {
        await createUser({
          username: values.username,
          password: values.password,
          realName: values.realName,
          email: values.email,
          phone: values.phone,
          roleId: values.roleId,
          department: values.department,
        });
        message.success('用户创建成功');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingUser(null);
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
      roleId: user.role?.id || user.roleId,
      department: user.department,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const openPasswordReset = (user: User) => {
    setPasswordUser(user);
    pwdForm.resetFields();
    setIsPasswordModal(true);
  };

  const handlePasswordReset = async (values: any) => {
    try {
      await resetPassword(passwordUser!.id, values.newPassword);
      message.success('密码重置成功');
      setIsPasswordModal(false);
      pwdForm.resetFields();
      setPasswordUser(null);
    } catch (e: any) {
      message.error(e.message || '密码重置失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success('用户已停用');
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const columns = [
    {
      title: 'ID', dataIndex: 'id', width: 60,
    },
    {
      title: '用户名', dataIndex: 'username', width: 120,
    },
    {
      title: '姓名', dataIndex: 'realName', width: 100,
    },
    {
      title: '邮箱', dataIndex: 'email', width: 180,
      render: (v: string | null) => v || '-',
    },
    {
      title: '电话', dataIndex: 'phone', width: 130,
      render: (v: string | null) => v || '-',
    },
    {
      title: '角色', dataIndex: ['role', 'roleName'], width: 100,
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '-',
    },
    {
      title: '部门', dataIndex: 'department', width: 100,
      render: (v: string | null) => v || '-',
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v: string) => <Tag color={statusColors[v] || 'default'}>{statusLabels[v] || v}</Tag>,
    },
    {
      title: '最后登录', dataIndex: 'lastLoginAt', width: 160,
      render: (v: string | null) => v ? new Date(v).toLocaleString('zh-CN') : '从未登录',
    },
    {
      title: '操作', key: 'actions', width: 200, fixed: 'right' as const,
      render: (_: any, record: User) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => openPasswordReset(record)}>
            重置密码
          </Button>
          <Popconfirm
            title="确定要停用该用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              停用
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>用户管理</Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="搜索用户名/姓名/邮箱"
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Select
                placeholder="状态筛选"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                style={{ width: 120 }}
                allowClear
              >
                <Option value="ACTIVE">正常</Option>
                <Option value="INACTIVE">已停用</Option>
                <Option value="LOCKED">已锁定</Option>
              </Select>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                新增用户
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
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

      {/* 创建/编辑用户 Modal */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); setEditingUser(null); }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!editingUser && (
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '至少3个字符' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
          )}
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '至少6个字符' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item
            name="realName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="电话">
                <Input placeholder="请输入电话" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="roleId"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  {roles.map((r) => (
                    <Option key={r.id} value={r.id}>{r.roleName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="部门">
                <Input placeholder="请输入部门" />
              </Form.Item>
            </Col>
          </Row>
          {editingUser && (
            <Form.Item name="status" label="状态">
              <Select>
                <Option value="ACTIVE">正常</Option>
                <Option value="INACTIVE">已停用</Option>
                <Option value="LOCKED">已锁定</Option>
              </Select>
            </Form.Item>
          )}
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => { setIsModalOpen(false); form.resetFields(); setEditingUser(null); }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingUser ? '保存' : '创建'}
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* 重置密码 Modal */}
      <Modal
        title={`重置密码 - ${passwordUser?.realName || ''}`}
        open={isPasswordModal}
        onCancel={() => { setIsPasswordModal(false); pwdForm.resetFields(); setPasswordUser(null); }}
        footer={null}
        width={400}
      >
        <Form form={pwdForm} layout="vertical" onFinish={handlePasswordReset}>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '至少6个字符' }]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => { setIsPasswordModal(false); pwdForm.resetFields(); setPasswordUser(null); }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              重置
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default UserListPage;
