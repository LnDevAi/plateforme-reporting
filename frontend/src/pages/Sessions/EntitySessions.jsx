import React, { useEffect, useState } from 'react'
import { Card, Tabs, Button, List, Input, Space, Tag } from 'antd'
import { useParams } from 'react-router-dom'
import { sessionsAPI } from '../../services/api'

function SessionTab({ type, entityId }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await sessionsAPI.list(entityId)
    setSessions(data.filter(s => s.type === type))
    setLoading(false)
  }

  useEffect(()=>{ load() }, [entityId])

  const create = async () => {
    const title = prompt('Titre de la session') || `${type} ${new Date().toLocaleDateString('fr-FR')}`
    await sessionsAPI.create(entityId, { type, title })
    load()
  }
  const start = async (id) => { await sessionsAPI.start(id); load() }
  const end = async (id) => { await sessionsAPI.end(id); load() }
  const post = async (id) => { if (!messageText) return; await sessionsAPI.postMessage(id, 'Vous', messageText); setMessageText(''); load() }

  return (
    <Card title={`Sessions ${type}`} extra={<Button onClick={create}>Nouvelle session</Button>}>
      <List
        loading={loading}
        dataSource={sessions}
        renderItem={(s) => (
          <List.Item actions={[
            s.status!=='live' && s.status!=='ended' ? <Button key="s" onClick={()=>start(s.id)}>Démarrer</Button> : null,
            s.status==='live' ? <Button key="e" danger onClick={()=>end(s.id)}>Clore</Button> : null,
          ]}>
            <List.Item.Meta title={<>{s.title} <Tag color={s.status==='live'?'green':s.status==='ended'?'default':'blue'}>{s.status}</Tag></>} description={`Créée le ${new Date(s.created_at).toLocaleString('fr-FR')}`} />
            <div style={{ width: '100%' }}>
              <List size="small" dataSource={s.messages} renderItem={(m)=> <List.Item>{m.author}: {m.text} <span style={{ color:'#999' }}>({new Date(m.at).toLocaleTimeString('fr-FR')})</span></List.Item>} />
              {s.status==='live' && (
                <Space style={{ marginTop: 8 }}>
                  <Input placeholder="Message" value={messageText} onChange={(e)=>setMessageText(e.target.value)} />
                  <Button onClick={()=>post(s.id)}>Envoyer</Button>
                </Space>
              )}
            </div>
          </List.Item>
        )}
      />
    </Card>
  )
}

function EntitySessions() {
  const { id } = useParams()
  return (
    <Tabs
      items={[
        { key: 'budgetaire', label: 'Session budgétaire', children: <SessionTab type="budgetaire" entityId={id} /> },
        { key: 'comptes', label: "Session d'arrêt des comptes", children: <SessionTab type="comptes" entityId={id} /> },
        { key: 'ag', label: 'Assemblée générale', children: <SessionTab type="ag" entityId={id} /> },
        { key: 'extra', label: 'Sessions extraordinaires', children: <SessionTab type="extra" entityId={id} /> },
      ]}
    />
  )
}

export default EntitySessions