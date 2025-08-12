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

const FALLBACK_SECTIONS = [
  { key: 'budget_execution', title: 'Rapport d’exécution du Budget', items: [ { id: 11, title: 'Exécution Budget 2025 S1', status: 'Brouillon', updated_at: '—' } ] },
  { key: 'rapport_activites', title: 'Rapport d’activités', items: [ { id: 12, title: 'Rapport semestriel 2025', status: 'Brouillon', updated_at: '—' } ] },
  { key: 'ppm_execution', title: 'Rapport d’exécution du PPM', items: [] },
  { key: 'etats_financiers', title: 'États financiers', items: [] },
  { key: 'bilan_social', title: 'Bilan social', items: [] },
  { key: 'rapport_gestion', title: 'Rapport de gestion', items: [] },
  { key: 'comites_audit', title: 'Rapports des comités d’audit', items: [] },
  { key: 'commissaire_comptes', title: 'Rapports du Commissaire aux comptes', items: [] },
  { key: 'sejour_pca', title: 'Rapports du séjour du PCA', items: [] },
  { key: 'rapport_ca_comptes', title: 'Rapport du CA sur la session d’arrêt des comptes', items: [] },
  { key: 'autres_exec', title: 'Autres documents', items: [] },
]

function DocumentsExecution() {
  const { data } = useQuery(['documents-execution'], documentsAPI.getExecution)
  const sections = data?.data || FALLBACK_SECTIONS

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {sections.map((section)=> (
        <SectionCard key={section.key} title={section.title} items={section.items} />
      ))}
    </Space>
  )
}

export default DocumentsExecution