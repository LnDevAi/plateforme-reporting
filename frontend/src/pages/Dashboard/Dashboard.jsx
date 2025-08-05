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
import { useQuery } from 'react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { dashboardAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const { Title, Text } = Typography
const { Option } = Select

function Dashboard() {
  const [period, setPeriod] = useState('7days')
  const { user } = useAuth()

  // Requêtes pour récupérer les données du tableau de bord
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    dashboardAPI.getStats,
    {
      refetchInterval: 30000, // Actualiser toutes les 30 secondes
    }
  )

  const { data: recentExecutions, isLoading: executionsLoading } = useQuery(
    'dashboard-recent-executions',
    () => dashboardAPI.getRecentExecutions({ limit: 10 })
  )

  const { data: popularReports, isLoading: reportsLoading } = useQuery(
    'dashboard-popular-reports',
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
    'dashboard-alerts',
    dashboardAPI.getAlerts
  )

  // Couleurs pour les graphiques
  const colors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1']

  // Colonnes pour le tableau des exécutions récentes
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

  return (
    <div className="fade-in">
      {/* Message de bienvenue */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          Bonjour, {user?.name} ! 👋
        </Title>
        <Text type="secondary">
          Voici un aperçu de l'activité de votre plateforme de reporting.
        </Text>
      </div>

      {/* Alertes */}
      {alerts?.data?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          {alerts.data.map((alert, index) => (
            <Alert
              key={index}
              message={alert.title}
              description={alert.message}
              type={alert.type}
              showIcon
              style={{ marginBottom: '8px' }}
              action={
                alert.report_id && (
                  <Button size="small" type="link">
                    Voir le rapport
                  </Button>
                )
              }
            />
          ))}
        </div>
      )}

      {/* Statistiques principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title="Total des rapports"
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
              title="Exécutions aujourd'hui"
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
              title="Taux de réussite"
              value={stats?.data?.success_rate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ 
                color: (stats?.data?.success_rate || 0) >= 90 ? '#52c41a' : '#faad14' 
              }}
            />
            <Progress 
              percent={stats?.data?.success_rate || 0} 
              showInfo={false} 
              size="small"
              strokeColor={(stats?.data?.success_rate || 0) >= 90 ? '#52c41a' : '#faad14'}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title="Utilisateurs actifs"
              value={stats?.data?.active_users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="stats-card-trend">
              <span>Total: {stats?.data?.total_users || 0}</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Graphique des exécutions */}
        <Col xs={24} lg={12}>
          <Card 
            title="Évolution des exécutions" 
            className="chart-container"
            extra={
              <Select 
                value={period} 
                onChange={setPeriod}
                style={{ width: 120 }}
              >
                <Option value="7days">7 jours</Option>
                <Option value="30days">30 jours</Option>
                <Option value="90days">90 jours</Option>
              </Select>
            }
            loading={chartsLoading}
          >
            {charts?.data?.executions_by_day && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={charts.data.executions_by_day}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#1890ff" 
                    strokeWidth={2}
                    name="Total"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="successful" 
                    stroke="#52c41a" 
                    strokeWidth={2}
                    name="Réussies"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="#ff4d4f" 
                    strokeWidth={2}
                    name="Échecs"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Graphique par catégorie */}
        <Col xs={24} lg={12}>
          <Card 
            title="Exécutions par catégorie" 
            className="chart-container"
            loading={chartsLoading}
          >
            {charts?.data?.executions_by_category && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.data.executions_by_category}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="execution_count" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Rapports populaires */}
        <Col xs={24} lg={12}>
          <Card 
            title="Rapports les plus populaires" 
            loading={reportsLoading}
            extra={
              <Button type="link" href="/reports">
                Voir tous
              </Button>
            }
          >
            {popularReports?.data?.map((report, index) => (
              <div 
                key={report.id}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: index < popularReports.data.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}
              >
                <div>
                  <Text strong>{report.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {report.category} • Créé par {report.creator?.name}
                  </Text>
                </div>
                <Tag color="blue">
                  {report.execution_count || 0} exécutions
                </Tag>
              </div>
            ))}
          </Card>
        </Col>

        {/* Exécutions récentes */}
        <Col xs={24} lg={12}>
          <Card 
            title="Exécutions récentes" 
            loading={executionsLoading}
            extra={
              <Button type="link">
                Voir l'historique
              </Button>
            }
          >
            <Table
              dataSource={recentExecutions?.data || []}
              columns={executionColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard