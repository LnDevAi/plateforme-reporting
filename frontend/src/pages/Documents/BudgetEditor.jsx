import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Table, InputNumber, Space, Typography, message } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { documentsAPI } from '../../services/api'
import WorkflowPanel from '../../components/Workflow/WorkflowPanel'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow, TableCell, WidthType } from 'docx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const { Title } = Typography

function BudgetEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const fileInputRef = React.useRef(null)

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

  const exportJSON = () => {
    const values = form.getFieldsValue(true)
    const blob = new Blob([JSON.stringify(values, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget_${id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const lines = form.getFieldValue('lines') || []
    const headers = ['chapter', 'item', 'amount']
    const rows = lines.map(l => [l.chapter, l.item, l.amount])
    const csv = [headers.join(','), ...rows.map(r=>r.map(v=>`"${(v??'').toString().replace(/"/g,'""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget_${id}_lignes.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    const values = form.getFieldsValue(true)
    const ws = XLSX.utils.json_to_sheet(values.lines || [])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lignes')
    const summary = [['Total', values.summary?.total || 0], ['Notes', values.summary?.notes || '']]
    const ws2 = XLSX.utils.aoa_to_sheet(summary)
    XLSX.utils.book_append_sheet(wb, ws2, 'Synthese')
    XLSX.writeFile(wb, `budget_${id}.xlsx`)
  }

  const exportWord = async () => {
    const values = form.getFieldsValue(true)
    const rows = (values.lines||[]).map(l => new TableRow({ children: [
      new TableCell({ children: [new Paragraph(l.chapter||'')], width: { size: 33, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph(l.item||'')], width: { size: 33, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph(String(l.amount||0))], width: { size: 34, type: WidthType.PERCENTAGE } }),
    ] }))
    const table = new DocxTable({ rows: [
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph('Chapitre')] }),
        new TableCell({ children: [new Paragraph('Poste')] }),
        new TableCell({ children: [new Paragraph('Montant')] }),
      ]}),
      ...rows,
    ]})
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: `Budget ${id}`, bold: true, size: 28 })], spacing: { after: 200 } }),
          new Paragraph('Hypothèses:'),
          new Paragraph(values.hypotheses||''),
          table,
          new Paragraph({ children: [new TextRun({ text: `Total: ${values.summary?.total||0}`, bold: true })] }),
          new Paragraph(`Notes: ${values.summary?.notes||''}`),
        ]
      }]
    })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget_${id}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const values = form.getFieldsValue(true)
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(`Budget ${id}`, 14, 16)
    doc.setFontSize(10)
    doc.text('Hypothèses:', 14, 24)
    const hypotheses = (values.hypotheses||'').toString()
    doc.text(doc.splitTextToSize(hypotheses, 180), 14, 30)
    const columns = [
      { header: 'Chapitre', dataKey: 'chapter' },
      { header: 'Poste', dataKey: 'item' },
      { header: 'Montant', dataKey: 'amount' },
    ]
    doc.autoTable({ startY: 50, columns, body: values.lines||[] })
    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 60
    doc.text(`Total: ${values.summary?.total||0}`, 14, finalY + 10)
    doc.text(`Notes: ${values.summary?.notes||''}`, 14, finalY + 16)
    doc.save(`budget_${id}.pdf`)
  }

  const importJSON = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const json = JSON.parse(text)
      form.setFieldsValue(json)
      await documentsAPI.saveElaborationItem('budget', id, json)
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
      <Title level={3}>{data?.title}</Title>
      <WorkflowPanel type="budget" id={id} />
      <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importJSON} />
      <Space>
        <Button onClick={exportJSON}>Exporter JSON</Button>
        <Button onClick={exportCSV}>Exporter CSV (lignes)</Button>
        <Button onClick={()=>fileInputRef.current?.click()}>Importer JSON</Button>
        <Button onClick={exportExcel}>Exporter Excel</Button>
        <Button onClick={exportWord}>Exporter Word</Button>
        <Button onClick={exportPDF}>Exporter PDF</Button>
      </Space>
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