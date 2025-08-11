import React from 'react'
import { Card, Upload, Table, Button, Tag } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { attachmentsAPI } from '../../services/api'

const { Dragger } = Upload

function AttachmentsManager() {
  const { data, isLoading } = useQuery(['attachments'], () => attachmentsAPI.list())

  const columns = [
    { title: 'Fichier', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t)=> <Tag>{t}</Tag> },
    { title: 'Statut', dataIndex: 'status', key: 'status', render: (s)=> <Tag color={s==='validé'?'green':'orange'}>{s}</Tag> },
  ]

  return (
    <Card title="Pièces justificatives">
      <Dragger multiple disabled>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Déposez vos fichiers ici (démo - désactivé)</p>
      </Dragger>
      <Table style={{ marginTop: 16 }} loading={isLoading} dataSource={data?.data || []} columns={columns} rowKey={(r)=>r.id} />
    </Card>
  )
}

export default AttachmentsManager