import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Table, InputNumber, Space, Typography, message, Select } from 'antd'
import { useParams } from 'react-router-dom'
import { documentsAPI } from '../../services/api'
import WorkflowPanel from '../../components/Workflow/WorkflowPanel'

const { Title } = Typography

function ActivitiesProgramEditor() {
  const { id } = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const fileInputRef = React.useRef(null)

  useEffect(() => {
    const run = async () => {
      const res = await documentsAPI.getElaborationItem('programme', id)
      form.setFieldsValue(res.data)
      setLoading(false)
    }
    run()
  }, [id])

  const actColumns = [
    { title: 'Activité', dataIndex: 'activity', render: (_, __, idx) => (
      <Form.Item name={['activities', idx, 'activity']} noStyle>
        <Input />
      </Form.Item>
    )},
    { title: 'Période', dataIndex: 'period', render: (_, __, idx) => (
      <Form.Item name={['activities', idx, 'period']} noStyle>
        <Select options={[{value:'T1'},{value:'T2'},{value:'T3'},{value:'T4'}]} style={{ width: '100%' }} />
      </Form.Item>
    )},
    { title: 'Budget', dataIndex: 'budget', render: (_, __, idx) => (
      <Form.Item name={['activities', idx, 'budget']} noStyle>
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
    )},
  ]

  const indColumns = [
    { title: 'Indicateur', dataIndex: 'name', render: (_, __, idx) => (
      <Form.Item name={['indicators', idx, 'name']} noStyle>
        <Input />
      </Form.Item>
    )},
    { title: 'Cible', dataIndex: 'target', render: (_, __, idx) => (
      <Form.Item name={['indicators', idx, 'target']} noStyle>
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
    )},
  ]

  const addRow = (field) => {
    const rows = form.getFieldValue(field) || []
    form.setFieldsValue({ [field]: [...rows, field==='activities' ? { activity:'', period:'T1', budget:0 } : { name:'', target:0 }] })
  }

  const doSave = async () => {
    const values = form.getFieldsValue(true)
    await documentsAPI.saveElaborationItem('programme', id, values)
    message.success('Brouillon enregistré')
  }

  const doSubmit = async () => {
    await doSave()
    await documentsAPI.submitElaborationItem('programme', id)
    message.success('Document soumis')
  }

  const doValidate = async () => {
    await documentsAPI.validateElaborationItem('programme', id)
    message.success('Document validé')
  }

  const exportJSON = () => {
    const values = form.getFieldsValue(true)
    const blob = new Blob([JSON.stringify(values, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `programme_${id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const json = JSON.parse(text)
      form.setFieldsValue(json)
      await documentsAPI.saveElaborationItem('programme', id, json)
      message.success('Import réussi')
    } catch (err) {
      message.error('Fichier JSON invalide')
    } finally {
      e.target.value = ''
    }
  }

  if (loading) return <Card>Chargement...</Card>

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={3}>Programme d’Activités</Title>
      <WorkflowPanel type="programme" id={id} />
      <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importJSON} />
      <Space>
        <Button onClick={exportJSON}>Exporter JSON</Button>
        <Button onClick={()=>fileInputRef.current?.click()}>Importer JSON</Button>
      </Space>
      <Form form={form} layout="vertical">
        <Card title="Objectifs généraux">
          <Form.Item name="goals">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Card>
        <Card title="Activités" extra={<Button onClick={()=>addRow('activities')}>Ajouter</Button>}>
          <Table pagination={false} columns={actColumns} dataSource={form.getFieldValue('activities') || []} rowKey={(_,i)=>i} />
        </Card>
        <Card title="Indicateurs" extra={<Button onClick={()=>addRow('indicators')}>Ajouter</Button>} style={{ marginTop: 12 }}>
          <Table pagination={false} columns={indColumns} dataSource={form.getFieldValue('indicators') || []} rowKey={(_,i)=>i} />
        </Card>
      </Form>
      <Space>
        <Button type="primary" onClick={doSave}>Enregistrer</Button>
        <Button onClick={doSubmit}>Soumettre</Button>
        <Button onClick={doValidate}>Valider</Button>
      </Space>
    </Space>
  )
}

export default ActivitiesProgramEditor