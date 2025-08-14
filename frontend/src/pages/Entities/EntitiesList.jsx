import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Modal, Input, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { entitiesAPI } from '../../services/api'
import { ministryAPI } from '../../services/api'

function EntitiesList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [ministryMap, setMinistryMap] = useState({})
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const exportJSON = () => {
    try {
      const raw = localStorage.getItem('entities') || '[]'
      const blob = new Blob([raw], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'entities.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }
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
    <Card title="Entités" extra={<Space><Button onClick={exportJSON}>Export JSON</Button><Button onClick={()=>setImportOpen(true)}>Import JSON</Button><Button type="primary" onClick={()=>navigate('/entities/create')}>Nouvelle entité</Button></Space>}>
      <Table loading={loading} dataSource={data} columns={columns} rowKey={(r)=>r.id} />
      <Modal title="Import JSON des entités" open={importOpen} onCancel={()=>setImportOpen(false)} onOk={async()=>{ try { const arr = JSON.parse(importText||'[]'); await entitiesAPI.bulkImport(arr); message.success('Importé'); setImportText(''); setImportOpen(false); load() } catch { message.error('JSON invalide') } }} okText="Importer">
        <Input.TextArea rows={8} value={importText} onChange={e=>setImportText(e.target.value)} placeholder='[
  {"name":"EPE Démo 1","type":"EPE"},
  {"name":"EPE Démo 2","type":"SocieteEtat"}
]'/>
      </Modal>
    </Card>
  )
}

export default EntitiesList