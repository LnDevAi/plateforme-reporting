import React from 'react'
import { Card, Typography, List, Button, Empty, Tag, Space } from 'antd'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { notificationAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import dayjs from 'dayjs'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  BellOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

function NotificationsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Récupérer toutes les notifications
  const { data: notifications, isLoading } = useQuery(
    'all-notifications',
    () => notificationAPI.getAll({ limit: 50 })
  )

  // Mutation pour marquer comme lu
  const markAsReadMutation = useMutation(notificationAPI.markAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('all-notifications')
      queryClient.invalidateQueries('notifications-unread-count')
    },
  })

  // Mutation pour marquer tout comme lu
  const markAllAsReadMutation = useMutation(notificationAPI.markAllAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('all-notifications')
      queryClient.invalidateQueries('notifications-unread-count')
    },
  })

  // Obtenir l'icône selon le type
  const getNotificationIcon = (type, priority) => {
    if (priority === 'high') {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    }

    switch (type) {
      case 'report_execution_complete':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'report_execution_failed':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'scheduled_report':
        return <BellOutlined style={{ color: '#1890ff' }} />
      default:
        return <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
    }
  }

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'red'
      case 'normal':
        return 'blue'
      case 'low':
        return 'green'
      default:
        return 'default'
    }
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          Mes notifications
        </Title>
        <Button 
          type="primary" 
          onClick={() => markAllAsReadMutation.mutate()}
          loading={markAllAsReadMutation.isLoading}
        >
          Tout marquer comme lu
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Chargement des notifications...
          </div>
        ) : notifications?.data?.length === 0 ? (
          <Empty 
            description="Aucune notification"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={notifications?.data || []}
            renderItem={(item) => (
              <List.Item
                style={{
                  backgroundColor: item.read_at ? 'transparent' : '#f6f8fa',
                  padding: '16px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  border: item.read_at ? '1px solid #f0f0f0' : '1px solid #1890ff',
                }}
                actions={[
                  !item.read_at && (
                    <Button
                      size="small"
                      onClick={() => markAsReadMutation.mutate({ notification_ids: [item.id] })}
                    >
                      Marquer comme lu
                    </Button>
                  ),
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}
                  </Text>
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(item.type, item.priority)}
                  title={
                    <Space>
                      <span style={{ fontWeight: item.read_at ? 'normal' : '600' }}>
                        {item.title}
                      </span>
                      <Tag color={getPriorityColor(item.priority)} size="small">
                        {item.priority}
                      </Tag>
                      {!item.read_at && (
                        <Tag color="processing" size="small">
                          Non lu
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <div style={{ marginTop: '8px' }}>
                      <Text>{item.message}</Text>
                      {item.data && Object.keys(item.data).length > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                          <strong>Données:</strong> {JSON.stringify(item.data, null, 2)}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}

export default NotificationsPage