import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { entitiesAPI } from '../../services/api'
import { ministryAPI } from '../../services/api'

function EntitiesList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [ministryMap, setMinistryMap] = useState({})
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const raw = localStorage.getItem('entities')
    let list = []
    try { list = raw ? JSON.parse(raw) : [] } catch { list = [] }
    setData(list)
    setLoading(false)
  }

  useEffect(()=>{ load(); ministryAPI.getMinistries().then(res=>{
    const map = {}
    ;(res.data||[]).forEach(m=>{ map[m.id] = m })
    setMinistryMap(map)
  }) }, [])

  const columns = [
    { title: 'Nom', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Ministère', dataIndex: 'ministryId', key: 'ministryId', render: (id)=> ministryMap[id]?.name || '-' },
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