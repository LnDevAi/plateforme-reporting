import React from 'react'
import { Card, Button, Table, Space, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { projectsAPI } from '../../services/api'
import { ministryAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

function ProjectsList() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery(['projects'], () => projectsAPI.getAll())
  const [ministryMap, setMinistryMap] = React.useState({})
  React.useEffect(()=>{ ministryAPI.getMinistries().then(res=>{
    const map = {}; (res.data||[]).forEach(m=> map[m.id]=m); setMinistryMap(map)
  }) }, [])

  const columns = [
    { title: 'Projet / Entité', dataIndex: 'name', key: 'name' },
    { title: 'Ministère', dataIndex: 'ministryId', key: 'ministryId', render: (id)=> ministryMap[id]?.name || '-' },
    { title: 'Responsable', dataIndex: 'owner', key: 'owner', render: (o) => o?.name || '-' },
    { title: 'Équipe', dataIndex: 'team', key: 'team', render: (team=[]) => team.slice(0,3).map(u => <Tag key={u.id}>{u.name}</Tag>) },
    { title: 'Objectifs', dataIndex: 'objectives', key: 'objectives', render: (objs=[]) => objs.slice(0,2).map((t,i)=>(<Tag key={i}>{t}</Tag>)) },
  ]

  return (
    <Card title="Projets / Entités" extra={<Button type="primary" onClick={() => navigate('/projects/create')}>Nouveau projet</Button>}>
      <Table
        loading={isLoading}
        dataSource={data?.data || []}
        columns={columns}
        rowKey={(row) => row.id}
      />
    </Card>
  )
}

export default ProjectsList