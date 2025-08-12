import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Table, InputNumber, Space, Typography, Select, DatePicker, message } from 'antd'
import { useParams } from 'react-router-dom'
import { documentsAPI } from '../../services/api'
import WorkflowPanel from '../../components/Workflow/WorkflowPanel'

const { Title } = Typography

function PPMEditor() {
  const { id } = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const fileInputRef = React.useRef(null)

  useEffect(() => {
    const run = async () => {
      const res = await documentsAPI.getElaborationItem('ppm', id)
      form.setFieldsValue(res.data)
      setLoading(false)
    }
    run()
  }, [id])

  const columns = [
    { title: 'Objet', dataIndex: 'subject', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'subject']} noStyle>
        <Input />
      </Form.Item>
    )},
    { title: 'Procédure', dataIndex: 'procedure', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'procedure']} noStyle>
        <Select options={[{value:'AO',label:'Appel d’offres'},{value:'DRP',label:'Demande de renseignements et prix'},{value:'AON',label:'AO national'}]} />
      </Form.Item>
    )},
    { title: 'Montant (FCFA)', dataIndex: 'amount', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'amount']} noStyle>
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
    )},
    { title: 'Statut', dataIndex: 'status', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'status']} noStyle>
        <Select options={[{value:'Planifié'},{value:'Lancé'},{value:'Attribué'},{value:'Annulé'}]} />
      </Form.Item>
    )},
    { title: 'Date prév.', dataIndex: 'planned_date', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'planned_date']} noStyle>
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
    )},
    { title: 'Date réelle', dataIndex: 'actual_date', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'actual_date']} noStyle>
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
    )},
  ]

  const addLine = () => {
    const rows = form.getFieldValue('lines') || []
    form.setFieldsValue({ lines: [...rows, { subject:'', procedure:'AO', amount:0, status:'Planifié', planned_date:null, actual_date:null }] })
  }

  const doSave = async () => {
    const values = form.getFieldsValue(true)
    await documentsAPI.saveElaborationItem('ppm', id, values)
    message.success('Brouillon enregistré')
  }

  const doSubmit = async () => {
    await doSave()
    await documentsAPI.submitElaborationItem('ppm', id)
    message.success('Document soumis')
  }

  const doValidate = async () => {
    await documentsAPI.validateElaborationItem('ppm', id)
    message.success('Document validé')
  }

  const exportJSON = () => {
    const values = form.getFieldsValue(true)
    const blob = new Blob([JSON.stringify(values, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ppm_${id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const lines = form.getFieldValue('lines') || []
    const headers = ['subject','procedure','amount','status','planned_date','actual_date']
    const rows = lines.map(l => [l.subject, l.procedure, l.amount, l.status, l.planned_date||'', l.actual_date||''])
    const csv = [headers.join(','), ...rows.map(r=>r.map(v=>`"${(v??'').toString().replace(/"/g,'""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ppm_${id}_lignes.csv`
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
      await documentsAPI.saveElaborationItem('ppm', id, json)
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
      <Title level={3}>Plan de Passation des Marchés</Title>
      <WorkflowPanel type="ppm" id={id} />
      <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importJSON} />
      <Space>
        <Button onClick={exportJSON}>Exporter JSON</Button>
        <Button onClick={exportCSV}>Exporter CSV (lignes)</Button>
        <Button onClick={()=>fileInputRef.current?.click()}>Importer JSON</Button>
      </Space>
      <Form form={form} layout="vertical">
        <Card title="Notes">
          <Form.Item name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Card>
        <Card title="Lignes PPM" extra={<Button onClick={addLine}>Ajouter</Button>}>
          <Table pagination={false} columns={columns} dataSource={form.getFieldValue('lines') || []} rowKey={(_,i)=>i} />
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

export default PPMEditor