import React from 'react'
import { Card, Button, Table, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { templatesAPI } from '../../services/api'

function TemplatesList() {
  const { data, isLoading } = useQuery(['templates'], () => templatesAPI.getAll())

  const columns = [
    { title: 'Modèle', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Tag>{t}</Tag> },
    { title: 'Sections', dataIndex: 'sections', key: 'sections', render: (s=[]) => s.length },
  ]

  return (
    <Card title="Modèles de rapports" extra={<Button type="primary">Nouveau modèle</Button>}>
      <Table loading={isLoading} dataSource={data?.data || []} columns={columns} rowKey={(r)=>r.id} />
    </Card>
  )
}

export default TemplatesList