import React from 'react'
import { Card, Table, Tag, Space } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { documentsAPI } from '../../services/api'

function SectionCard({ title, items }) {
  const columns = [
    { title: 'Titre', dataIndex: 'title', key: 'title' },
    { title: 'Statut', dataIndex: 'status', key: 'status', render: (s)=> <Tag color={s==='Validé'?'green':s==='Soumis'?'blue':'orange'}>{s}</Tag> },
    { title: 'Mise à jour', dataIndex: 'updated_at', key: 'updated_at' },
  ]
  return (
    <Card title={title} style={{ marginBottom: 16 }}>
      <Table dataSource={items} columns={columns} rowKey={(r)=>r.id} pagination={false} />
    </Card>
  )
}

function DocumentsExecution() {
  const { data, isLoading } = useQuery(['documents-execution'], documentsAPI.getExecution)

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {isLoading && <Card>Chargement...</Card>}
      {!isLoading && data?.data?.map((section)=> (
        <SectionCard key={section.key} title={section.title} items={section.items} />
      ))}
    </Space>
  )
}

export default DocumentsExecution