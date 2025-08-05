import React, { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Progress,
  Select,
  Space,
  Button,
  Alert,
  Typography,
  Tabs,
  Timeline,
  List,
  Avatar,
  Divider,
  Empty,
  Tooltip,
  Badge
} from 'antd'
import {
  TrophyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BankOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DownloadOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined
} from '@ant-design/icons'
import { useQuery } from 'react-query'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { kpiAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Option } = Select

function MinistryDashboard() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [selectedMinistry, setSelectedMinistry] = useState(user?.ministry_id || 'all')

  // Récupérer les KPI globaux
  const { data: globalKpis, isLoading: globalLoading } = useQuery(
    ['global-kpis', selectedPeriod, selectedMinistry],
    () => kpiAPI.getGlobalKpis({ period: selectedPeriod, ministry_id: selectedMinistry }),
    {
      refetchInterval: 60000, // Actualiser chaque minute
    }
  )

  // Récupérer les KPI du ministère spécifique si applicable
  const { data: ministryKpis, isLoading: ministryLoading } = useQuery(
    ['ministry-kpis', selectedMinistry],
    () => selectedMinistry !== 'all' ? kpiAPI.getMinistryKpis(selectedMinistry) : null,
    {
      enabled: selectedMinistry !== 'all',
      refetchInterval: 60000,
    }
  )

  // Couleurs pour les graphiques
  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2']

  // Rendu des métriques principales
  const renderMainMetrics = () => {
    const overview = globalKpis?.data?.overview || {}
    
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Entités EPE"
              value={overview.total_entities}
              suffix={`/ ${overview.active_entities} actives`}
              prefix={<BankOutlined style={{ color: '#1890ff' }} />}
            />
            <Progress 
              percent={overview.active_entities ? Math.round((overview.active_entities / overview.total_entities) * 100) : 0}
              size="small"
              strokeColor="#1890ff"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rapports Totaux"
              value={overview.total_reports}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {overview.monthly_submissions} ce mois
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="En Attente d'Approbation"
              value={overview.pending_approvals}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
            <Progress 
              percent={overview.total_reports ? Math.round((overview.pending_approvals / overview.total_reports) * 100) : 0}
              size="small"
              strokeColor="#faad14"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Taux de Conformité"
              value={overview.compliance_rate}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: overview.compliance_rate >= 80 ? '#52c41a' : '#f5222d' }} />}
            />
            <Progress 
              percent={overview.compliance_rate}
              size="small"
              strokeColor={overview.compliance_rate >= 80 ? '#52c41a' : '#f5222d'}
            />
          </Card>
        </Col>
      </Row>
    )
  }

  // Rendu de la performance des ministères
  const renderMinistryPerformance = () => {
    const ministryData = globalKpis?.data?.ministry_performance || []

    const columns = [
      {
        title: 'Ministère',
        dataIndex: 'ministry_name',
        key: 'ministry_name',
        render: (text, record) => (
          <Space direction="vertical" size="small">
            <Text strong>{text}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.minister}
            </Text>
          </Space>
        )
      },
      {
        title: 'EPE Tutelle Technique',
        dataIndex: 'technical_epes_count',
        key: 'technical_epes_count',
        align: 'center',
        render: (count) => <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
      },
      {
        title: 'EPE Tutelle Financière',
        dataIndex: 'financial_epes_count',
        key: 'financial_epes_count',
        align: 'center',
        render: (count) => <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      },
      {
        title: 'Conformité Globale',
        dataIndex: 'overall_compliance',
        key: 'overall_compliance',
        align: 'center',
        render: (rate) => (
          <Space>
            <Progress 
              type="circle" 
              size={50} 
              percent={rate} 
              strokeColor={rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#f5222d'}
            />
            <Text>{rate}%</Text>
          </Space>
        )
      },
      {
        title: 'Approbations en Attente',
        dataIndex: 'pending_approvals',
        key: 'pending_approvals',
        align: 'center',
        render: (count) => (
          <Tag color={count > 10 ? 'red' : count > 5 ? 'orange' : 'green'}>
            {count}
          </Tag>
        )
      }
    ]

    return (
      <Card title="Performance par Ministère" className="ministry-performance-card">
        <Table
          dataSource={ministryData}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="ministry_id"
        />
      </Card>
    )
  }

  // Rendu du classement des EPE
  const renderEpeRankings = () => {
    const rankings = globalKpis?.data?.epe_rankings || {}
    const topPerformers = rankings.top_performers || []
    const bottomPerformers = rankings.bottom_performers || []

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <TrophyOutlined style={{ color: '#faad14' }} />
                <span>Top Performers</span>
              </Space>
            }
          >
            <List
              dataSource={topPerformers.slice(0, 5)}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ 
                        backgroundColor: index === 0 ? '#faad14' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#1890ff' 
                      }}>
                        {index + 1}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Text strong>{item.entity_name}</Text>
                        <Tag color="blue">{item.sector}</Tag>
                      </Space>
                    }
                    description={
                      <Space>
                        <Text>Score: {item.compliance_score}%</Text>
                        <Divider type="vertical" />
                        <Text>Rapports: {item.reports_count}</Text>
                      </Space>
                    }
                  />
                  <Progress percent={item.compliance_score} size="small" />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <WarningOutlined style={{ color: '#f5222d' }} />
                <span>Nécessitent une Attention</span>
              </Space>
            }
          >
            <List
              dataSource={bottomPerformers}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#f5222d' }}>!</Avatar>}
                    title={
                      <Space>
                        <Text strong>{item.entity_name}</Text>
                        <Tag color="red">{item.sector}</Tag>
                      </Space>
                    }
                    description={
                      <Space>
                        <Text type="danger">Score: {item.compliance_score}%</Text>
                        <Divider type="vertical" />
                        <Text>Rapports: {item.reports_count}</Text>
                      </Space>
                    }
                  />
                  <Progress 
                    percent={item.compliance_score} 
                    size="small" 
                    strokeColor="#f5222d"
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    )
  }

  // Rendu des tendances
  const renderTrends = () => {
    const trends = globalKpis?.data?.trends_analysis || {}
    
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Évolution des Soumissions" className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends.submission_trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="submissions" stroke="#1890ff" fill="#1890ff" fillOpacity={0.3} />
                <Area type="monotone" dataKey="approved" stroke="#52c41a" fill="#52c41a" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Taux de Conformité" className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.compliance_trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip formatter={(value) => [`${value}%`, 'Conformité']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="compliance_rate" 
                  stroke="#52c41a" 
                  strokeWidth={3}
                  dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Temps d'Approbation Moyen" className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends.approval_time_trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value}h`, 'Temps moyen']} />
                <Legend />
                <Bar dataKey="average_hours" fill="#faad14" />
                <Bar dataKey="target_hours" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    )
  }

  // Rendu des alertes et recommandations
  const renderAlerts = () => {
    const alerts = globalKpis?.data?.alerts_summary || {}
    
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Rapports en Retard" size="small">
            <List
              dataSource={alerts.overdue_reports || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#f5222d' }} icon={<ClockCircleOutlined />} />}
                    title={<Text strong>{item.name}</Text>}
                    description={`En retard de ${item.days_overdue} jours`}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'Aucun rapport en retard' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Documents Manquants" size="small">
            <List
              dataSource={alerts.missing_documents || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#faad14' }} icon={<FileTextOutlined />} />}
                    title={<Text strong>{item.name}</Text>}
                    description={`Échéance: ${item.deadline}`}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'Tous les documents requis sont présents' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Problèmes de Conformité" size="small">
            <List
              dataSource={alerts.compliance_issues || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#f5222d' }} icon={<WarningOutlined />} />}
                    title={<Text strong>{item.entity_name}</Text>}
                    description={item.issue_description}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'Aucun problème de conformité détecté' }}
            />
          </Card>
        </Col>
      </Row>
    )
  }

  return (
    <div className="ministry-dashboard">
      {/* En-tête avec contrôles */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Space direction="vertical">
            <Title level={2} style={{ margin: 0 }}>
              <BankOutlined /> Tableau de Bord Ministériel
            </Title>
            <Text type="secondary">
              Supervision et contrôle des EPE - Vue d'ensemble des KPI
            </Text>
          </Space>
        </Col>
        <Col>
          <Space>
            <Select
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              style={{ width: 120 }}
            >
              <Option value="3months">3 mois</Option>
              <Option value="6months">6 mois</Option>
              <Option value="12months">12 mois</Option>
            </Select>
            
            {user?.isAdmin() && (
              <Select
                value={selectedMinistry}
                onChange={setSelectedMinistry}
                style={{ width: 200 }}
                placeholder="Tous les ministères"
              >
                <Option value="all">Tous les ministères</Option>
                <Option value="1">Min. Économie et Finances</Option>
                <Option value="2">Min. Infrastructures</Option>
                <Option value="3">Min. Énergie</Option>
                <Option value="4">Min. Transport</Option>
              </Select>
            )}

            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => {
                // Logique d'export
              }}
            >
              Exporter
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Alerte de conformité UEMOA */}
      <Alert
        message="Conformité Réglementaire UEMOA"
        description={`Taux de conformité global: ${globalKpis?.data?.overview?.compliance_rate || 0}%. ${
          (globalKpis?.data?.overview?.compliance_rate || 0) >= 80 
            ? 'Excellent niveau de conformité aux directives UEMOA.' 
            : 'Des améliorations sont nécessaires pour atteindre les standards UEMOA.'
        }`}
        type={(globalKpis?.data?.overview?.compliance_rate || 0) >= 80 ? 'success' : 'warning'}
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Métriques principales */}
      {renderMainMetrics()}

      {/* Onglets pour les différentes vues */}
      <Card style={{ marginTop: '24px' }}>
        <Tabs defaultActiveKey="overview" size="large">
          <TabPane tab="Vue d'Ensemble" key="overview">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {renderMinistryPerformance()}
              {renderEpeRankings()}
            </Space>
          </TabPane>

          <TabPane tab="Tendances" key="trends">
            {renderTrends()}
          </TabPane>

          <TabPane tab="Alertes" key="alerts">
            {renderAlerts()}
          </TabPane>

          <TabPane tab="Conformité UEMOA" key="compliance">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Score de Conformité par Critère">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Nomenclature', score: 92.1 },
                      { name: 'Délais', score: 78.3 },
                      { name: 'Qualité', score: 89.2 },
                      { name: 'Complétude', score: 86.7 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip formatter={(value) => [`${value}%`, 'Score']} />
                      <Bar dataKey="score" fill="#1890ff" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="Répartition des Statuts de Conformité">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Conforme', value: 76, color: '#52c41a' },
                          { name: 'En cours', value: 18, color: '#faad14' },
                          { name: 'Non conforme', value: 6, color: '#f5222d' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {[
                          { name: 'Conforme', value: 76, color: '#52c41a' },
                          { name: 'En cours', value: 18, color: '#faad14' },
                          { name: 'Non conforme', value: 6, color: '#f5222d' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default MinistryDashboard