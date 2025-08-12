import React, { useState, useEffect } from 'react'
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Table, 
  Tag, 
  Button,
  Select,
  Alert,
  Tabs,
  Spin,
  Space,
  Progress
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PlayCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { dashboardAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const { Title, Text } = Typography
const { Option } = Select

function Dashboard() {
  const [period, setPeriod] = useState('7days')
  const { user } = useAuth()

  // Scope KPI: ensemble | ministere | entite
  const [scope, setScope] = useState('ensemble')
  const [selectedMinistry, setSelectedMinistry] = useState(undefined)
  const [selectedEntity, setSelectedEntity] = useState(undefined)

  // Load entities and ministries from localStorage (démo)
  const [entities, setEntities] = useState([])
  const [ministries, setMinistries] = useState([])
  useEffect(() => {
    try {
      const raw = localStorage.getItem('entities')
      const list = raw ? JSON.parse(raw) : []
      setEntities(list)
      const mins = Array.from(new Set(list.map(e => (e?.tutelle?.technique || '').trim()).filter(Boolean)))
      setMinistries(mins)
    } catch {
      setEntities([]); setMinistries([])
    }
  }, [])

  // Requêtes pour récupérer les données du tableau de bord
  const { data: stats, isLoading: statsLoading } = useQuery(
    ['dashboard-stats'],
    dashboardAPI.getStats,
    {
      refetchInterval: 30000,
    }
  )

  const { data: recentExecutions, isLoading: executionsLoading } = useQuery(
    ['dashboard-recent-executions'],
    () => dashboardAPI.getRecentExecutions({ limit: 10 })
  )

  const { data: popularReports, isLoading: reportsLoading } = useQuery(
    ['dashboard-popular-reports'],
    () => dashboardAPI.getPopularReports({ limit: 5 })
  )

  const { data: charts, isLoading: chartsLoading } = useQuery(
    ['dashboard-charts', period],
    () => dashboardAPI.getExecutionCharts({ period }),
    {
      enabled: !!period,
    }
  )

  const { data: alerts } = useQuery(
    ['dashboard-alerts'],
    dashboardAPI.getAlerts
  )

  // Couleurs pour les graphiques
  const colors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1']

  // Columns
  const executionColumns = [
    {
      title: 'Rapport',
      dataIndex: ['report', 'name'],
      key: 'reportName',
      ellipsis: true,
    },
    {
      title: 'Utilisateur',
      dataIndex: ['executor', 'name'],
      key: 'executor',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          completed: { color: 'success', icon: <CheckCircleOutlined />, text: 'Terminé' },
          failed: { color: 'error', icon: <CloseCircleOutlined />, text: 'Échec' },
          running: { color: 'processing', icon: <ClockCircleOutlined />, text: 'En cours' },
        }
        const config = statusConfig[status] || statusConfig.running
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      },
    },
    {
      title: 'Durée',
      dataIndex: 'execution_time',
      key: 'duration',
      render: (time) => time ? `${time}s` : '-',
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('fr-FR'),
    },
  ]

  if (statsLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Spin size="large" tip="Chargement du tableau de bord..." />
      </div>
    )
  }

  const scopeControls = (
    <Space wrap>
      <Tabs
        size="small"
        activeKey={scope}
        onChange={setScope}
        items={[
          { key: 'ensemble', label: 'Ensemble' },
          { key: 'ministere', label: 'Ministère' },
          { key: 'entite', label: 'Entité' },
        ]}
      />
      {scope === 'ministere' && (
        <Select
          allowClear
          showSearch
          placeholder="Sélectionner un ministère"
          style={{ minWidth: 260 }}
          value={selectedMinistry}
          onChange={setSelectedMinistry}
          options={ministries.map(m => ({ value: m, label: m }))}
        />
      )}
      {scope === 'entite' && (
        <Select
          allowClear
          showSearch
          placeholder="Sélectionner une entité"
          style={{ minWidth: 260 }}
          value={selectedEntity}
          onChange={setSelectedEntity}
          options={entities.map(e => ({ value: e.id, label: e.name }))}
        />
      )}
    </Space>
  )

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>Tableau de bord</Title>
          <Text type="secondary">Bonjour, {user?.name} ! 👋</Text>
        </div>
        {scopeControls}
      </div>

      {/* Alertes */}
      {alerts?.data?.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {alerts.data.map((alert, index) => (
            <Alert
              key={index}
              message={alert.title}
              description={alert.message}
              type={alert.type}
              showIcon
              style={{ marginBottom: '8px' }}
            />
          ))}
        </div>
      )}

      {/* Statistiques principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title={`Total des rapports (${scope})`}
              value={stats?.data?.total_reports || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="stats-card-trend positive">
              <ArrowUpOutlined />
              <span>{stats?.data?.active_reports || 0} actifs</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title={`Exécutions aujourd'hui (${scope})`}
              value={stats?.data?.executions_today || 0}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="stats-card-trend">
              <span>Total: {stats?.data?.total_executions || 0}</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title={`Utilisateurs (${scope})`}
              value={stats?.data?.users_count || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title={`Échecs (${scope})`}
              value={stats?.data?.failed_executions || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Graphiques */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title={`Exécutions (${period})`}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={charts?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="executions" stroke="#1890ff" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Répartition (démo)">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie dataKey="value" data={[{ name: 'OK', value: 70 }, { name: 'Warn', value: 20 }, { name: 'KO', value: 10 }]} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                  {[0,1,2].map((i) => <Cell key={i} fill={colors[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Exécutions récentes */}
      <Card style={{ marginTop: 16 }} title="Exécutions récentes">
        <Table
          loading={executionsLoading}
          dataSource={recentExecutions?.data || []}
          columns={executionColumns}
          rowKey={(row) => row.id}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  )
}

export default Dashboard