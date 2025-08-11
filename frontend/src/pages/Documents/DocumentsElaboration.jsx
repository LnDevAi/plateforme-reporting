import React, { useEffect, useState } from 'react'
import { Card, Button, Table, Tag, Space } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { documentsAPI } from '../../services/api'

function SectionCard({ title, items, onCreate }) {
  const columns = [
    { title: 'Titre', dataIndex: 'title', key: 'title' },
    { title: 'Statut', dataIndex: 'status', key: 'status', render: (s)=> <Tag color={s==='Validé'?'green':s==='Soumis'?'blue':'orange'}>{s}</Tag> },
    { title: 'Mise à jour', dataIndex: 'updated_at', key: 'updated_at' },
  ]
  return (
    <Card title={title} extra={<Button onClick={onCreate}>Créer un brouillon</Button>} style={{ marginBottom: 16 }}>
      <Table dataSource={items} columns={columns} rowKey={(r)=>r.id} pagination={false} />
    </Card>
  )
}

function DocumentsElaboration() {
  const { data, isLoading } = useQuery(['documents-elaboration'], documentsAPI.getElaboration)
  const [sections, setSections] = useState([])

  useEffect(()=>{
    if (data?.data) setSections(data.data)
  }, [data])

  const handleCreateDraft = (key) => {
    setSections((prev) => prev.map((s)=> s.key===key ? {
      ...s,
      items: [
        ...s.items,
        { id: Math.floor(Math.random()*100000), title: `Brouillon ${s.items.length+1}`, status: 'Brouillon', updated_at: new Date().toLocaleString('fr-FR') }
      ]
    } : s))
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {isLoading && <Card>Chargement...</Card>}
      {!isLoading && sections.map((section)=> (
        <SectionCard
          key={section.key}
          title={section.title}
          items={section.items}
          onCreate={() => handleCreateDraft(section.key)}
        />
      ))}
    </Space>
  )
}

export default DocumentsElaboration