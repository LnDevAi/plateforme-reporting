import React, { useEffect, useState } from 'react'
import { Card, Steps, Button, Space, Tag, Input, message } from 'antd'
import { workflowAPI } from '../../services/api'

function WorkflowPanel({ type, id }) {
  const [instance, setInstance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await workflowAPI.getInstance(type, id)
    setInstance(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [type, id])

  const submit = async () => {
    const res = await workflowAPI.submit(type, id)
    setInstance(res.data)
    message.success('Soumis au workflow')
  }
  const approve = async () => {
    const res = await workflowAPI.approve(type, id, comment)
    setInstance(res.data)
    setComment('')
    message.success('Étape approuvée')
  }
  const reject = async () => {
    const res = await workflowAPI.reject(type, id, comment)
    setInstance(res.data)
    setComment('')
    message.success('Étape rejetée')
  }

  if (loading) return <Card>Chargement workflow...</Card>

  const current = instance?.currentStepIndex ?? -1
  return (
    <Card title="Workflow de validation" extra={instance?.status && <Tag color={instance.status==='approved'?'green':instance.status==='rejected'?'red':'blue'}>{instance.status}</Tag>}>
      {(!instance || instance.status==='not_started') && (
        <Button type="primary" onClick={submit}>Soumettre</Button>
      )}
      {instance && instance.steps?.length>0 && (
        <>
          <Steps current={Math.max(current, 0)} items={instance.steps.map((s)=>({ title: s.role, description: s.note, status: s.status==='approved'?'finish':s.status==='awaiting'?'process':s.status==='rejected'?'error':'wait' }))} />
          {instance.status==='in_progress' && (
            <Space style={{ marginTop: 12 }}>
              <Input.TextArea rows={2} placeholder="Commentaire" value={comment} onChange={(e)=>setComment(e.target.value)} />
              <Button onClick={approve} type="primary">Approuver</Button>
              <Button onClick={reject} danger>Rejeter</Button>
            </Space>
          )}
        </>
      )}
    </Card>
  )
}

export default WorkflowPanel