import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import useAuthStore from './stores/authStore';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// 路由守卫
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// 临时占位页面（逐步替换为真实页面）
const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ textAlign: 'center', padding: 80 }}>
    <h2>{title}</h2>
    <p>页面开发中，即将上线</p>
  </div>
);

const ClientListPage = () => <Placeholder title="客户管理" />;
const MatterListPage = () => <Placeholder title="业务事项" />;
const TaskBoardPage = () => <Placeholder title="任务管理" />;
const TimeEntryPage = () => <Placeholder title="计时收费" />;
const CommunicationPage = () => <Placeholder title="沟通记录" />;

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={<ProtectedRoute><AppLayout /></ProtectedRoute>}
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="clients" element={<ClientListPage />} />
            <Route path="matters" element={<MatterListPage />} />
            <Route path="tasks" element={<TaskBoardPage />} />
            <Route path="time" element={<TimeEntryPage />} />
            <Route path="communications" element={<CommunicationPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
