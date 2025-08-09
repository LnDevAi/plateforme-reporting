import React, { useState } from 'react';
import { Badge, Dropdown, List, Typography, Button, Empty } from 'antd';
import { BellOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';

const { Text } = Typography;

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Nouveau rapport disponible',
      message: 'Le rapport financier Q1 2024 est maintenant disponible.',
      timestamp: '2024-01-15 14:30',
      read: false,
      type: 'info'
    },
    {
      id: 2,
      title: 'Session programmée',
      message: 'Une nouvelle session est programmée pour demain à 10h.',
      timestamp: '2024-01-14 16:45',
      read: false,
      type: 'warning'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const notificationItems = [
    {
      key: 'header',
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
          <Text strong>Notifications</Text>
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={markAllAsRead}>
              Marquer tout comme lu
            </Button>
          )}
        </div>
      ),
    },
    {
      key: 'content',
      label: (
        <div style={{ maxHeight: 300, width: 300 }}>
          {notifications.length > 0 ? (
            <List
              size="small"
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item
                  style={{ 
                    backgroundColor: item.read ? 'transparent' : '#f6ffed',
                    padding: '8px 12px',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  actions={[
                    !item.read && (
                      <Button
                        type="link"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => markAsRead(item.id)}
                      />
                    ),
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => deleteNotification(item.id)}
                    />
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={<Text strong style={{ fontSize: 12 }}>{item.title}</Text>}
                    description={
                      <div>
                        <Text style={{ fontSize: 11 }}>{item.message}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 10 }}>{item.timestamp}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty 
              description="Aucune notification" 
              style={{ padding: '20px' }}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{ items: notificationItems }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small">
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ border: 'none' }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationCenter;