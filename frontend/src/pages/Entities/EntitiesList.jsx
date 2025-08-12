import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { entitiesAPI } from '../../services/api'

function EntitiesList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const { data } = await entitiesAPI.getAll()
    setData(data)
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  const columns = [
    { title: 'Nom', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Tutelle technique', dataIndex: ['tutelle','technique'], key: 'technique' },
    { title: 'Tutelle financier', dataIndex: ['tutelle','financier'], key: 'financier' },
    { title: 'Actions', key: 'actions', render: (_, record) => (
      <Space>
        <Button onClick={()=>navigate(`/entities/${record.id}`)}>Détail</Button>
        <Button onClick={()=>navigate(`/entities/${record.id}/sessions`)}>Sessions</Button>
      </Space>
    )},
  ]

  return (
    <Card title="Entités" extra={<Button type="primary" onClick={()=>navigate('/entities/create')}>Nouvelle entité</Button>}>
      <Table loading={loading} dataSource={data} columns={columns} rowKey={(r)=>r.id} />
    </Card>
  )
}

export default EntitiesList