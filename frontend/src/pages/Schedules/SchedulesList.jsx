import React, { useState } from 'react'
import { 
  Table, 
  Card, 
  Button, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Dropdown, 
  Modal,
  message,
  Row,
  Col,
  Typography,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { scheduleAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import dayjs from 'dayjs'

const { Search } = Input
const { Option } = Select
const { Title } = Typography
const { confirm } = Modal

function SchedulesList() {
  const [filters, setFilters] = useState({
    search: '',
    frequency: '',
    active: '',
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  })

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()

  // Récupérer les planifications
  const { data: schedulesData, isLoading } = useQuery(
    ['schedules', filters, pagination],
    () => scheduleAPI.getAll({
      ...filters,
      page: pagination.current,
      per_page: pagination.pageSize,
    }),
    {
      keepPreviousData: true,
    }
  )

  // Récupérer les fréquences disponibles
  const { data: frequencies } = useQuery('schedule-frequencies', scheduleAPI.getFrequencies)

  // Mutation pour supprimer une planification
  const deleteMutation = useMutation(scheduleAPI.delete, {
    onSuccess: () => {
      message.success('Planification supprimée avec succès')
      queryClient.invalidateQueries('schedules')
    },
    onError: (error) => {
      message.error('Erreur lors de la suppression: ' + error.message)
    },
  })

  // Mutation pour activer/désactiver une planification
  const toggleStatusMutation = useMutation(scheduleAPI.toggleStatus, {
    onSuccess: (data) => {
      message.success(data.message)
      queryClient.invalidateQueries('schedules')
    },
    onError: (error) => {
      message.error('Erreur lors du changement de statut: ' + error.message)
    },
  })

  // Mutation pour exécuter maintenant
  const executeNowMutation = useMutation(scheduleAPI.executeNow, {
    onSuccess: (data) => {
      message.success(data.message)
      queryClient.invalidateQueries('schedules')
    },
    onError: (error) => {
      message.error('Erreur lors de l\'exécution: ' + error.message)
    },
  })

  // Gérer la suppression
  const handleDelete = (record) => {
    confirm({
      title: 'Supprimer la planification',
      content: `Êtes-vous sûr de vouloir supprimer la planification "${record.name}" ?`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: () => {
        deleteMutation.mutate(record.id)
      },
    })
  }

  // Gérer l'activation/désactivation
  const handleToggleStatus = (record) => {
    const action = record.is_active ? 'désactiver' : 'activer'
    confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} la planification`,
      content: `Êtes-vous sûr de vouloir ${action} la planification "${record.name}" ?`,
      okText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Annuler',
      onOk: () => {
        toggleStatusMutation.mutate(record.id)
      },
    })
  }

  // Gérer l'exécution immédiate
  const handleExecuteNow = (record) => {
    confirm({
      title: 'Exécuter maintenant',
      content: `Êtes-vous sûr de vouloir exécuter immédiatement la planification "${record.name}" ?`,
      okText: 'Exécuter',
      cancelText: 'Annuler',
      onOk: () => {
        executeNowMutation.mutate(record.id)
      },
    })
  }

  // Actions pour chaque planification
  const getActionItems = (record) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Voir',
      onClick: () => navigate(`/schedules/${record.id}`),
    },
    {
      key: 'execute',
      icon: <PlayCircleOutlined />,
      label: 'Exécuter maintenant',
      onClick: () => handleExecuteNow(record),
      disabled: !record.is_active,
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Modifier',
      onClick: () => navigate(`/schedules/${record.id}/edit`),
      disabled: !hasPermission('create_reports'),
    },
    {
      key: 'toggle',
      icon: record.is_active ? <PauseCircleOutlined /> : <PlayCircleOutlined />,
      label: record.is_active ? 'Désactiver' : 'Activer',
      onClick: () => handleToggleStatus(record),
      disabled: !hasPermission('create_reports'),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Supprimer',
      danger: true,
      onClick: () => handleDelete(record),
      disabled: !hasPermission('create_reports'),
    },
  ]

  // Colonnes du tableau
  const columns = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/schedules/${record.id}`)}
          style={{ padding: 0, height: 'auto' }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Rapport',
      dataIndex: ['report', 'name'],
      key: 'reportName',
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/reports/${record.report?.id}`)}
          style={{ padding: 0, height: 'auto', fontSize: '13px' }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Fréquence',
      dataIndex: 'frequency_description',
      key: 'frequency',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Prochaine exécution',
      dataIndex: 'next_run_at',
      key: 'nextRun',
      render: (date, record) => {
        if (!record.is_active) {
          return <Tag color="default">Inactif</Tag>
        }
        if (!date) {
          return <Tag color="orange">Non planifié</Tag>
        }
        
        const nextRun = dayjs(date)
        const now = dayjs()
        const isOverdue = nextRun.isBefore(now)
        
        return (
          <Tooltip title={nextRun.format('DD/MM/YYYY HH:mm')}>
            <Tag color={isOverdue ? 'red' : 'green'}>
              {isOverdue ? 'En retard' : nextRun.fromNow()}
            </Tag>
          </Tooltip>
        )
      },
    },
    {
      title: 'Dernière exécution',
      dataIndex: 'last_run_at',
      key: 'lastRun',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Jamais',
    },
    {
      title: 'Statut',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive) => (
        <Tag 
          color={isActive ? 'success' : 'default'}
          icon={isActive ? <CheckCircleOutlined /> : <PauseCircleOutlined />}
        >
          {isActive ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionItems(record) }}
          trigger={['click']}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  // Gérer les changements de pagination
  const handleTableChange = (pagination) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    })
  }

  // Gérer les changements de filtres
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))
    setPagination(prev => ({
      ...prev,
      current: 1,
    }))
  }

  return (
    <div className="fade-in">
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Planifications automatiques
          </Title>
        </Col>
        <Col>
          {hasPermission('create_reports') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/schedules/create')}
              size="large"
            >
              Nouvelle planification
            </Button>
          )}
        </Col>
      </Row>

      <Card>
        {/* Filtres */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="Rechercher une planification..."
              allowClear
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Fréquence"
              allowClear
              value={filters.frequency}
              onChange={(value) => handleFilterChange('frequency', value)}
              style={{ width: '100%' }}
            >
              {frequencies?.data?.map(freq => (
                <Option key={freq.value} value={freq.value}>
                  {freq.label}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Statut"
              allowClear
              value={filters.active}
              onChange={(value) => handleFilterChange('active', value)}
              style={{ width: '100%' }}
            >
              <Option value="true">Actif</Option>
              <Option value="false">Inactif</Option>
            </Select>
          </Col>
        </Row>

        {/* Tableau */}
        <Table
          columns={columns}
          dataSource={schedulesData?.data?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: schedulesData?.data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} sur ${total} planifications`,
          }}
          onChange={handleTableChange}
          className="data-table"
        />
      </Card>
    </div>
  )
}

export default SchedulesList