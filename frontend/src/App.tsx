import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'

const { Content } = Layout

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <Routes>
          {/* TODO: 后续添加路由配置 */}
          {/* <Route path="/login" element={<Login />} /> */}
          {/* <Route path="/" element={<MainLayout />}> */}
          {/*   <Route index element={<Dashboard />} /> */}
          {/*   <Route path="contracts" element={<ContractList />} /> */}
          {/*   <Route path="cases" element={<CaseList />} /> */}
          {/*   <Route path="agents" element={<AgentList />} /> */}
          {/* </Route> */}
          <Route
            path="/"
            element={
              <div style={{ textAlign: 'center', padding: '100px' }}>
                <h1>公司法务智慧管理系统</h1>
                <p>框架搭建完成，正在开发中...</p>
              </div>
            }
          />
        </Routes>
      </Content>
    </Layout>
  )
}

export default App
