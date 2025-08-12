import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  Layout, 
  Menu, 
  Button, 
  Dropdown, 
  Avatar, 
  Typography,
  Space,
  notification
} from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  BarChartOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  FileDoneOutlined,
  ClusterOutlined,
  PaperClipOutlined,
  FolderOpenOutlined,
  BookOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import NotificationCenter from '../Notifications/NotificationCenter'

const { Header, Sider, Content } = Layout
const { Title } = Typography

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
      notification.success({ message: 'Déconnexion réussie', description: 'Vous avez été déconnecté avec succès.' })
    } catch (error) {
      notification.error({ message: 'Erreur de déconnexion', description: 'Une erreur est survenue lors de la déconnexion.' })
    }
  }

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Profil', onClick: () => navigate('/profile') },
    { key: 'settings', icon: <SettingOutlined />, label: 'Paramètres' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Déconnexion', onClick: handleLogout },
  ]

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Tableau de bord' },
    {
      key: '/projects', icon: <ApartmentOutlined />, label: 'Projets / Entités',
      children: [
        { key: '/projects', icon: <ApartmentOutlined />, label: 'Liste des projets' },
        { key: '/projects/create', icon: <PlusOutlined />, label: 'Nouveau projet' },
      ]
    },
    {
      key: '/entities', icon: <ApartmentOutlined />, label: 'Inscription entités',
      children: [
        { key: '/entities', icon: <ApartmentOutlined />, label: 'Liste des entités' },
        { key: '/entities/create', icon: <PlusOutlined />, label: 'Nouvelle entité' },
      ]
    },
    {
      key: '/reports', icon: <FolderOpenOutlined />, label: 'Rapports',
      children: [
        { key: '/reports/elaboration', icon: <FileDoneOutlined />, label: 'Élaboration' },
        { key: '/reports/execution', icon: <ClusterOutlined />, label: 'Exécution' },
      ]
    },
    { key: '/templates', icon: <FileDoneOutlined />, label: 'Modèles de rapports' },
    { key: '/workflow', icon: <ClusterOutlined />, label: 'Workflow de validation' },
    { key: '/attachments', icon: <PaperClipOutlined />, label: 'Pièces justificatives' },
    { key: '/e-learning', icon: <BookOutlined />, label: 'E‑Learning' },
    {
      key: '/schedules', icon: <ClockCircleOutlined />, label: 'Planifications',
      children: [
        { key: '/schedules', icon: <ClockCircleOutlined />, label: 'Liste des planifications' },
        { key: '/schedules/create', icon: <PlusOutlined />, label: 'Nouvelle planification' },
      ]
    },
    { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytiques' },
    { key: '/ai-assistant', icon: <ThunderboltOutlined />, label: 'Assistant IA' },
  ]

  if (isAdmin()) {
    menuItems.push({ key: '/users', icon: <TeamOutlined />, label: 'Utilisateurs' })
  }

  const handleMenuClick = ({ key }) => { navigate(key) }

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/reports/')) {
      if (path === '/reports/elaboration') return ['/reports/elaboration']
      if (path === '/reports/execution') return ['/reports/execution']
      return ['/reports']
    }
    if (path.startsWith('/entities/')) {
      return ['/entities']
    }
    if (path.startsWith('/schedules/')) {
      if (path === '/schedules/create') return ['/schedules/create']
      return ['/schedules']
    }
    if (path.startsWith('/projects/')) {
      if (path === '/projects/create') return ['/projects/create']
      return ['/projects']
    }
    return [path]
  }

  const getOpenKeys = () => {
    const path = location.pathname
    if (path.startsWith('/reports')) return ['/reports']
    if (path.startsWith('/entities')) return ['/entities']
    if (path.startsWith('/schedules')) return ['/schedules']
    if (path.startsWith('/projects')) return ['/projects']
    return []
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={250} className="app-sidebar" style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}>
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          {!collapsed ? (<Title level={4} style={{ margin: 0, color: '#1890ff' }}>Reporting</Title>) : (<Title level={4} style={{ margin: 0, color: '#1890ff' }}>R</Title>)}
        </div>
        <Menu theme="light" mode="inline" selectedKeys={getSelectedKeys()} defaultOpenKeys={getOpenKeys()} items={menuItems} onClick={handleMenuClick} style={{ borderRight: 0 }} />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        <Header className="app-header" style={{ position: 'fixed', top: 0, right: 0, left: collapsed ? 80 : 250, zIndex: 1000, transition: 'left 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '16px' }} />
            <Title level={4} style={{ margin: 0, flex: 1 }}>
              {location.pathname === '/dashboard' && 'Tableau de bord'}
              {location.pathname === '/projects' && 'Projets / Entités'}
              {location.pathname === '/projects/create' && 'Nouveau projet'}
              {location.pathname === '/entities' && 'Entités'}
              {location.pathname === '/entities/create' && 'Inscription entité'}
              {location.pathname?.startsWith('/entities/') && 'Entité'}
              {location.pathname === '/reports/elaboration' && 'Rapports - Élaboration'}
              {location.pathname === '/reports/execution' && 'Rapports - Exécution'}
              {location.pathname === '/templates' && 'Modèles de rapports'}
              {location.pathname === '/workflow' && 'Workflow de validation'}
              {location.pathname === '/attachments' && 'Pièces justificatives'}
              {location.pathname === '/schedules' && 'Planifications'}
              {location.pathname === '/schedules/create' && 'Nouvelle planification'}
              {location.pathname === '/users' && 'Gestion des utilisateurs'}
              {location.pathname === '/profile' && 'Profil utilisateur'}
            </Title>
          </div>

          <Space size="middle">
            <NotificationCenter />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
                <span>{user?.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ marginTop: 64, padding: 24 }}>
          <div style={{ minHeight: 'calc(100vh - 64px)', background: 'transparent' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout