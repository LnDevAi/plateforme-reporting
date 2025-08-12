import React, { useEffect, useState } from 'react'
import { Card, Button, Table, Tag, Space } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { documentsAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

function SectionCard({ title, items, onCreate, onOpen }) {
  const columns = [
    { title: 'Titre', dataIndex: 'title', key: 'title' },
    { title: 'Statut', dataIndex: 'status', key: 'status', render: (s)=> <Tag color={s==='Validé'?'green':s==='Soumis'?'blue':'orange'}>{s}</Tag> },
    { title: 'Mise à jour', dataIndex: 'updated_at', key: 'updated_at' },
    { title: 'Actions', key: 'actions', render: (_, record) => (
      <Space>
        <Button onClick={()=>onOpen?.(record)}>Ouvrir</Button>
      </Space>
    )}
  ]
  return (
    <Card title={title} extra={<Button onClick={onCreate}>Créer un brouillon</Button>} style={{ marginBottom: 16 }}>
      <Table dataSource={items} columns={columns} rowKey={(r)=>r.id} pagination={false} />
    </Card>
  )
}

const FALLBACK_SECTIONS = [
  { key: 'budget_prevision', title: 'Budget prévisionnel', items: [ { id: 1, title: 'Budget 2025', status: 'Brouillon', updated_at: '—' } ] },
  { key: 'programme_activites', title: 'Programme d’Activités', items: [ { id: 2, title: 'PA 2025', status: 'Brouillon', updated_at: '—' } ] },
  { key: 'ppm', title: 'Plan de Passation des Marchés (PPM)', items: [ { id: 3, title: 'PPM 2025', status: 'Brouillon', updated_at: '—' } ] },
  { key: 'autres_elab', title: 'Autres documents', items: [] },
  { key: 'avis_audit', title: 'Avis du Comité d’audit', items: [] },
  { key: 'avis_commissaire', title: 'Avis du Commissaire aux Comptes', items: [] },
  { key: 'rapport_ca_budget', title: 'Rapport du CA sur la session budgétaire', items: [] },
]

function DocumentsElaboration() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery(['documents-elaboration'], documentsAPI.getElaboration)
  const [sections, setSections] = useState(FALLBACK_SECTIONS)

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

  const openEditor = (sectionKey, record) => {
    if (sectionKey === 'budget_prevision') navigate(`/reports/elaboration/budget/${record.id}`)
    else if (sectionKey === 'programme_activites') navigate(`/reports/elaboration/programme/${record.id}`)
    else if (sectionKey === 'ppm') navigate(`/reports/elaboration/ppm/${record.id}`)
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {sections.map((section)=> (
        <SectionCard
          key={section.key}
          title={section.title}
          items={section.items}
          onCreate={() => handleCreateDraft(section.key)}
          onOpen={(record)=>openEditor(section.key, record)}
        />
      ))}
    </Space>
  )
}

export default DocumentsElaboration