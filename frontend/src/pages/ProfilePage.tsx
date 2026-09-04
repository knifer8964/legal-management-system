import React from 'react';
import { Card, Descriptions, Avatar, Typography, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import useAuthStore from '../stores/authStore';

const { Title } = Typography;

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div>
      <Title level={4}>个人资料</Title>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <Avatar size={64} icon={<UserOutlined />} />
          <div style={{ marginLeft: 16 }}>
            <h2>{user.realName || user.username}</h2>
            <Tag color="blue">{user.role?.roleName}</Tag>
          </div>
        </div>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
          <Descriptions.Item label="姓名">{user.realName || '-'}</Descriptions.Item>
          <Descriptions.Item label="角色">{user.role?.roleName || '-'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="权限">
            {Array.isArray(user.role?.permissions) && user.role?.permissions.includes('*')
              ? '全部权限'
              : Array.isArray(user.role?.permissions)
                ? user.role?.permissions.join(', ')
                : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default ProfilePage;
