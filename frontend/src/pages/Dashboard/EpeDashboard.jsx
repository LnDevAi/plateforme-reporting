import React, { useState } from 'react'
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Progress, 
  Table, 
  Tag, 
  Button, 
  Select, 
  Space,
  Alert,
  Typography,
  Timeline,
  Divider
} from 'antd'
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  CalendarOutlined,
  BankOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import { useQuery } from 'react-query'
import { dashboardAPI } from '../../services/api'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const { Title, Text } = Typography
const { Option } = Select

function EpeDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024')
  const [selectedEntity, setSelectedEntity] = useState('all')

  // Données spécifiques EPE (en production, viendraient de l'API)
  const epeMetrics = {
    sessions_budgetaires: {
      total: 156,
      completed: 142,
      pending: 14,
      compliance_rate: 91
    },
    arret_comptes: {
      total: 89,
      validated: 82,
      in_review: 7,
      certification_rate: 92
    },
    assemblees_generales: {
      total: 45,
      approved: 43,
      postponed: 2,
      attendance_rate: 87
    },
    comptabilite_matieres: {
      total: 234,
      up_to_date: 201,
      late: 33,
      compliance_rate: 86
    }
  }

  const entitesEpe = [
    'SONABEL', 'ONEA', 'SONAPOST', 'AIR_BURKINA', 
    'SITARAIL', 'BARC', 'LONAB', 'SONATERA'
  ]

  // Données des graphiques
  const complianceData = [
    { name: 'Sessions Budgétaires', taux: 91, objectif: 95 },
    { name: 'Arrêt des Comptes', taux: 92, objectif: 90 },
    { name: 'Assemblées Générales', taux: 87, objectif: 85 },
    { name: 'Comptabilité Matières', taux: 86, objectif: 90 }
  ]

  const evolutionMensuelle = [
    { mois: 'Jan', rapports: 32, conformes: 29 },
    { mois: 'Fév', rapports: 28, conformes: 26 },
    { mois: 'Mar', rapports: 35, conformes: 33 },
    { mois: 'Avr', rapports: 41, conformes: 38 },
    { mois: 'Mai', rapports: 38, conformes: 36 },
    { mois: 'Jun', rapports: 44, conformes: 42 }
  ]

  const repartitionParEntite = [
    { entite: 'SONABEL', nombre: 45, pourcentage: 28.8 },
    { entite: 'ONEA', nombre: 38, pourcentage: 24.4 },
    { entite: 'SONAPOST', nombre: 25, pourcentage: 16.0 },
    { entite: 'AIR_BURKINA', nombre: 18, pourcentage: 11.5 },
    { entite: 'Autres', nombre: 30, pourcentage: 19.3 }
  ]

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']

  // Colonnes pour le tableau des rapports récents
  const recentReportsColumns = [
    {
      title: 'Type de Rapport',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <Text strong>{type}</Text>
        </Space>
      )
    },
    {
      title: 'Entité EPE',
      dataIndex: 'entite',
      key: 'entite',
      render: (entite) => (
        <Tag color="blue">{entite}</Tag>
      )
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut) => {
        const statusConfig = {
          'Conforme': { color: 'success', icon: <CheckCircleOutlined /> },
          'En cours': { color: 'processing', icon: <ClockCircleOutlined /> },
          'À réviser': { color: 'warning', icon: <ExclamationCircleOutlined /> }
        }
        const config = statusConfig[statut] || { color: 'default', icon: null }
        return (
          <Tag color={config.color} icon={config.icon}>
            {statut}
          </Tag>
        )
      }
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date'
    }
  ]

  const recentReportsData = [
    {
      key: '1',
      type: 'Budget Annuel',
      entite: 'SONABEL',
      statut: 'Conforme',
      date: '15/12/2024'
    },
    {
      key: '2',
      type: 'États Financiers',
      entite: 'ONEA',
      statut: 'En cours',
      date: '14/12/2024'
    },
    {
      key: '3',
      type: 'Inventaire Patrimoine',
      entite: 'SONAPOST',
      statut: 'À réviser',
      date: '13/12/2024'
    },
    {
      key: '4',
      type: 'Plan Passation Marchés',
      entite: 'AIR_BURKINA',
      statut: 'Conforme',
      date: '12/12/2024'
    }
  ]

  return (
    <div className="fade-in">
      {/* En-tête avec filtres */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <BankOutlined /> Tableau de Bord EPE
          </Title>
          <Text type="secondary">
            Suivi de la conformité UEMOA et obligations réglementaires
          </Text>
        </Col>
        <Col>
          <Space size="middle">
            <Select
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              style={{ width: 120 }}
            >
              <Option value="2024">2024</Option>
              <Option value="2023">2023</Option>
              <Option value="2022">2022</Option>
            </Select>
            <Select
              value={selectedEntity}
              onChange={setSelectedEntity}
              style={{ width: 150 }}
              placeholder="Toutes les entités"
            >
              <Option value="all">Toutes les entités</Option>
              {entitesEpe.map(entite => (
                <Option key={entite} value={entite}>{entite}</Option>
              ))}
            </Select>
          </Space>
        </Col>
      </Row>

      {/* Alerte de conformité UEMOA */}
      <Alert
        message="Conformité UEMOA - Exercice 2024"
        description="86% des rapports sont conformes aux directives UEMOA. 14 rapports nécessitent une attention particulière."
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        style={{ marginBottom: '24px' }}
        action={
          <Button size="small" type="primary">
            Voir le détail
          </Button>
        }
      />

      {/* Métriques principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sessions Budgétaires"
              value={epeMetrics.sessions_budgetaires.completed}
              suffix={`/ ${epeMetrics.sessions_budgetaires.total}`}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            />
            <Progress 
              percent={epeMetrics.sessions_budgetaires.compliance_rate} 
              size="small"
              strokeColor="#1890ff"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {epeMetrics.sessions_budgetaires.pending} en attente
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Arrêt des Comptes"
              value={epeMetrics.arret_comptes.validated}
              suffix={`/ ${epeMetrics.arret_comptes.total}`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress 
              percent={epeMetrics.arret_comptes.certification_rate} 
              size="small"
              strokeColor="#52c41a"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {epeMetrics.arret_comptes.in_review} en révision
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Assemblées Générales"
              value={epeMetrics.assemblees_generales.approved}
              suffix={`/ ${epeMetrics.assemblees_generales.total}`}
              prefix={<CalendarOutlined style={{ color: '#faad14' }} />}
            />
            <Progress 
              percent={epeMetrics.assemblees_generales.attendance_rate} 
              size="small"
              strokeColor="#faad14"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {epeMetrics.assemblees_generales.postponed} reportées
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Comptabilité Matières"
              value={epeMetrics.comptabilite_matieres.up_to_date}
              suffix={`/ ${epeMetrics.comptabilite_matieres.total}`}
              prefix={<BarChartOutlined style={{ color: '#f5222d' }} />}
            />
            <Progress 
              percent={epeMetrics.comptabilite_matieres.compliance_rate} 
              size="small"
              strokeColor="#f5222d"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {epeMetrics.comptabilite_matieres.late} en retard
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Graphiques */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Taux de Conformité par Catégorie" className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="taux" fill="#1890ff" name="Taux actuel %" />
                <Bar dataKey="objectif" fill="#52c41a" name="Objectif %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Évolution Mensuelle des Rapports" className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionMensuelle}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rapports" stroke="#1890ff" name="Total rapports" />
                <Line type="monotone" dataKey="conformes" stroke="#52c41a" name="Rapports conformes" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title="Rapports Récents" 
            extra={<Button type="link">Voir tous</Button>}
          >
            <Table
              columns={recentReportsColumns}
              dataSource={recentReportsData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Répartition par Entité EPE">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={repartitionParEntite}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="nombre"
                  label={({ entite, pourcentage }) => `${entite}: ${pourcentage}%`}
                >
                  {repartitionParEntite.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <Card title="Timeline des Obligations Réglementaires">
            <Timeline>
              <Timeline.Item color="green">
                <Text strong>31 Décembre 2024</Text> - Clôture des comptes exercice 2024
              </Timeline.Item>
              <Timeline.Item color="blue">
                <Text strong>31 Janvier 2025</Text> - Transmission états financiers provisoires
              </Timeline.Item>
              <Timeline.Item color="orange">
                <Text strong>31 Mars 2025</Text> - Assemblées Générales Ordinaires
              </Timeline.Item>
              <Timeline.Item color="red">
                <Text strong>30 Avril 2025</Text> - Transmission comptes définitifs UEMOA
              </Timeline.Item>
              <Timeline.Item>
                <Text strong>31 Mai 2025</Text> - Rapports d'audit externe
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default EpeDashboard