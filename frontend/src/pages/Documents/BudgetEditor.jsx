import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Table, InputNumber, Space, Typography, message } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { documentsAPI } from '../../services/api'
import WorkflowPanel from '../../components/Workflow/WorkflowPanel'

const { Title } = Typography

function BudgetEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    const run = async () => {
      const res = await documentsAPI.getElaborationItem('budget', id)
      setData(res.data)
      form.setFieldsValue(res.data)
      setLoading(false)
    }
    run()
  }, [id])

  const columns = [
    { title: 'Chapitre', dataIndex: 'chapter', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'chapter']} noStyle>
        <Input />
      </Form.Item>
    )},
    { title: 'Poste', dataIndex: 'item', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'item']} noStyle>
        <Input />
      </Form.Item>
    )},
    { title: 'Montant', dataIndex: 'amount', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'amount']} noStyle>
        <InputNumber min={0} style={{ width: '100%' }} formatter={(v)=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} parser={(v)=>Number((v||'').replace(/\s/g,''))} />
      </Form.Item>
    )},
  ]

  const addLine = () => {
    const lines = form.getFieldValue('lines') || []
    form.setFieldsValue({ lines: [...lines, { chapter: '', item: '', amount: 0 }] })
  }

  const recalcTotal = () => {
    const lines = form.getFieldValue('lines') || []
    const total = lines.reduce((sum, l) => sum + (Number(l.amount)||0), 0)
    form.setFieldsValue({ summary: { ...(form.getFieldValue('summary')||{}), total } })
  }

  const onValuesChange = (_, all) => {
    if (all.lines) recalcTotal()
  }

  const doSave = async () => {
    const values = form.getFieldsValue(true)
    await documentsAPI.saveElaborationItem('budget', id, values)
    message.success('Brouillon enregistré')
  }

  const doSubmit = async () => {
    await doSave()
    await documentsAPI.submitElaborationItem('budget', id)
    message.success('Document soumis')
  }

  const doValidate = async () => {
    await documentsAPI.validateElaborationItem('budget', id)
    message.success('Document validé')
  }

  if (loading) return <Card>Chargement...</Card>

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={3}>{data?.title}</Title>
      <WorkflowPanel type="budget" id={id} />
      <Card title="Hypothèses">
        <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
          <Form.Item name="hypotheses" label="Hypothèses générales">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Card title="Lignes budgétaires" extra={<Button onClick={addLine}>Ajouter une ligne</Button>}>
            <Table pagination={false} columns={columns} dataSource={form.getFieldValue('lines') || []} rowKey={(_,i)=>i} />
          </Card>
          <Card title="Synthèse" style={{ marginTop: 12 }}>
            <Form.Item name={['summary', 'total']} label="Total">
              <InputNumber readOnly style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name={['summary', 'notes']} label="Notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Card>
        </Form>
      </Card>
      <Space>
        <Button type="primary" onClick={doSave}>Enregistrer</Button>
        <Button onClick={doSubmit}>Soumettre</Button>
        <Button onClick={doValidate}>Valider</Button>
      </Space>
    </Space>
  )
}

export default BudgetEditor