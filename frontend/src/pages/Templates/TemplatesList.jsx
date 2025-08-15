import React from 'react'
import { Card, Button, Table, Tag, Tabs } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { templatesAPI } from '../../services/api'

function TemplatesList() {
  const { data, isLoading } = useQuery(['templates'], () => templatesAPI.getAll())
  const navigate = useNavigate()

  const columns = (sessionKey) => ([
    {
      title: 'Modèle',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => <a onClick={()=> navigate(`/templates/${record.id}`)}>{text}</a>
    },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Tag>{t}</Tag> },
    { title: 'Phase', dataIndex: 'phase', key: 'phase', render: (p) => p ? <Tag color="blue">{p}</Tag> : '-' },
  ])

  return (
    <Card title="Modèles de rapports" extra={<Button type="primary">Nouveau modèle</Button>}>
      <Tabs
        defaultActiveKey="budgetaire"
        items={[
          { key: 'budgetaire', label: 'Session Budgétaire', children: (
            <Table loading={isLoading} dataSource={(data?.data||[]).filter(t=>t.session==='budgetaire')} columns={columns('budgetaire')} rowKey={(r)=>r.id} pagination={{ pageSize: 8 }} />
          )},
          { key: 'cloture', label: "Session d'arrêt des comptes", children: (
            <Table loading={isLoading} dataSource={(data?.data||[]).filter(t=>t.session==='cloture')} columns={columns('cloture')} rowKey={(r)=>r.id} pagination={{ pageSize: 8 }} />
          )},
          { key: 'generique', label: 'Génériques', children: (
            <Table loading={isLoading} dataSource={(data?.data||[]).filter(t=>t.session==='generique')} columns={columns('generique')} rowKey={(r)=>r.id} pagination={{ pageSize: 8 }} />
          )},
        ]}
      />
    </Card>
  )
}

export default TemplatesList