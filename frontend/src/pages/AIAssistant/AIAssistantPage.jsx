import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import { ThunderboltOutlined, BookOutlined, UserOutlined } from '@ant-design/icons';
import AIChat from '../../components/AIAssistant/AIChat';

const { Title, Paragraph } = Typography;

const AIAssistantPage = () => {
  return (
    <div style={{ padding: '0 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* En-tête de la page */}
      <div style={{ marginBottom: '24px' }}>
        <Space align="center" style={{ marginBottom: '16px' }}>
          <ThunderboltOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
          <Title level={2} style={{ margin: 0 }}>
            Assistant IA Expert EPE
          </Title>
          <Tag color="green">Beta</Tag>
        </Space>
        
        <Paragraph style={{ fontSize: '16px', color: '#666', maxWidth: '800px' }}>
          Votre assistant personnel spécialisé en gouvernance des entreprises publiques africaines. 
          Expert en réglementation OHADA/UEMOA, formations EPE et analyse financière.
        </Paragraph>
      </div>

      {/* Informations sur les capacités */}
      <div style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Tag icon={<BookOutlined />} color="blue">
            Base de connaissances OHADA/UEMOA
          </Tag>
          <Tag icon={<UserOutlined />} color="purple">
            Formations pour administrateurs
          </Tag>
          <Tag icon={<ThunderboltOutlined />} color="orange">
            Analyse financière EPE
          </Tag>
        </Space>
      </div>

      {/* Interface de chat */}
      <Card 
        style={{ 
          height: 'calc(100vh - 280px)',
          minHeight: '600px'
        }}
        bodyStyle={{ 
          height: '100%', 
          padding: 0 
        }}
      >
        <AIChat />
      </Card>
    </div>
  );
};

export default AIAssistantPage;