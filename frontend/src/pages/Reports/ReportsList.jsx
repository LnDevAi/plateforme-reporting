import React from 'react';
import { Button, Table, Space, Tag, Card, message } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const ReportsList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Mock data pour les rapports
  const mockReports = [
    {
      id: 1,
      title: 'Rapport Financier Q1 2024',
      type: 'financial',
      status: 'published',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
    },
    {
      id: 2,
      title: 'Analyse de Performance',
      type: 'performance',
      status: 'draft',
      createdAt: '2024-02-01',
      updatedAt: '2024-02-05',
    },
  ];

  const columns = [
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => navigate(`/reports/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'financial' ? 'green' : 'blue'}>
          {type === 'financial' ? 'Financier' : 'Performance'}
        </Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'published' ? 'success' : 'warning'}>
          {status === 'published' ? 'Publié' : 'Brouillon'}
        </Tag>
      ),
    },
    {
      title: 'Créé le',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/reports/${record.id}`)}
          >
            Voir
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/reports/${record.id}/edit`)}
          >
            Modifier
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  const handleDelete = (id) => {
    message.success('Rapport supprimé avec succès');
    // Logique de suppression
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <h2>Liste des Rapports</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/reports/create')}
          >
            Nouveau Rapport
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={mockReports}
          rowKey="id"
          pagination={{
            total: mockReports.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );
};

export default ReportsList;