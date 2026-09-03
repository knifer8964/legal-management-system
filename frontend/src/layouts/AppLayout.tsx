import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  LogoutOutlined,
  UserOutlined,
  PlayCircleOutlined,
  TeamOutlined as UsersOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import useAuthStore from '../stores/authStore';
import { useTimeEntryStore } from '../stores/timeEntryStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { running, elapsed, fetchRunning, tickElapsed } = useTimeEntryStore();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    fetchRunning();
    // Poll running timer every 10s
    const interval = setInterval(() => { fetchRunning(); tickElapsed(); }, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/clients', icon: <TeamOutlined />, label: '客户管理' },
    { key: '/matters', icon: <FolderOpenOutlined />, label: '业务事项' },
    { key: '/tasks', icon: <CheckSquareOutlined />, label: '任务管理' },
    { key: '/time', icon: <ClockCircleOutlined />, label: '计时收费' },
    { key: '/communications', icon: <MessageOutlined />, label: '沟通记录' },
    { key: '/users', icon: <UsersOutlined />, label: '用户管理' },
  ];

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人资料' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth={60}>
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 17, fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          法务工作室
        </div>
        <Menu
          theme="dark" mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <div>
            {running && (
              <Badge status="processing" text={
                <Text type="secondary">
                  ⏱️ <Text strong>{running.description}</Text> — {formatTime(elapsed)}
                </Text>
              } />
            )}
          </div>
          <Dropdown menu={{ items: userMenuItems, onClick: ({ key }) => {
            if (key === 'logout') { logout(); navigate('/login'); }
            if (key === 'profile') navigate('/profile');
          }}} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <Text>{user?.name || '用户'}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
