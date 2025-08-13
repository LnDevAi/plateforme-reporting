import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Table, InputNumber, Space, Typography, message, Select, Tag, List } from 'antd'
import { useParams } from 'react-router-dom'
import { documentsAPI } from '../../services/api'
import WorkflowPanel from '../../components/Workflow/WorkflowPanel'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow, TableCell, WidthType } from 'docx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const { Title } = Typography

function ActivitiesProgramEditor() {
  const { id } = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const fileInputRef = React.useRef(null)
  const [locked, setLocked] = useState(false)
  const [delib, setDelib] = useState({ title:'', decision:'Adoptée', text:'' })
  const [signature, setSignature] = useState(null)

  useEffect(() => {
    const run = async () => {
      const res = await documentsAPI.getElaborationItem('programme', id)
      form.setFieldsValue(res.data)
      setSignature(res.data.signature || null)
      setLocked(!!res.data.locked)
      setLoading(false)
    }
    run()
  }, [id])

  const actColumns = [
    { title: 'Activité', dataIndex: 'activity', render: (_, __, idx) => (
      <Form.Item name={['activities', idx, 'activity']} noStyle>
        <Input disabled={locked} />
      </Form.Item>
    )},
    { title: 'Période', dataIndex: 'period', render: (_, __, idx) => (
      <Form.Item name={['activities', idx, 'period']} noStyle>
        <Select disabled={locked} options={[{value:'T1'},{value:'T2'},{value:'T3'},{value:'T4'}]} style={{ width: '100%' }} />
      </Form.Item>
    )},
    { title: 'Budget', dataIndex: 'budget', render: (_, __, idx) => (
      <Form.Item name={['activities', idx, 'budget']} noStyle>
        <InputNumber disabled={locked} min={0} style={{ width: '100%' }} />
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
    if (locked) return
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
    setLocked(true)
    message.success('Document validé')
  }
  const doSign = async () => {
    const values = form.getFieldsValue(true)
    const sig = { name: 'Utilisateur', at: new Date().toISOString(), id: `SIG-PROG-${id}` }
    await documentsAPI.saveElaborationItem('programme', id, { ...values, signature: sig })
    setSignature(sig)
    message.success('Signé (démo)')
  }
  const addDelib = async () => {
    if (!delib.title) return message.info('Titre requis')
    await documentsAPI.addElaborationDeliberation('programme', id, delib)
    const res = await documentsAPI.getElaborationItem('programme', id)
    form.setFieldsValue(res.data)
    setDelib({ title:'', decision:'Adoptée', text:'' })
  }
  const removeDelib = async (did) => {
    await documentsAPI.removeElaborationDeliberation('programme', id, did)
    const res = await documentsAPI.getElaborationItem('programme', id)
    form.setFieldsValue(res.data)
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

  const exportExcel = () => {
    const values = form.getFieldsValue(true)
    const wb = XLSX.utils.book_new()
    const wsActs = XLSX.utils.json_to_sheet(values.activities || [])
    XLSX.utils.book_append_sheet(wb, wsActs, 'Activites')
    const wsInds = XLSX.utils.json_to_sheet(values.indicators || [])
    XLSX.utils.book_append_sheet(wb, wsInds, 'Indicateurs')
    XLSX.writeFile(wb, `programme_${id}.xlsx`)
  }

  const exportWord = async () => {
    const values = form.getFieldsValue(true)
    const actRows = (values.activities||[]).map(a => new TableRow({ children: [
      new TableCell({ children: [new Paragraph(a.activity||'')], width: { size: 50, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph(a.period||'')], width: { size: 20, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph(String(a.budget||0))], width: { size: 30, type: WidthType.PERCENTAGE } }),
    ] }))
    const actsTable = new DocxTable({ rows: [ new TableRow({ children: [ new TableCell({ children:[new Paragraph('Activité')]}), new TableCell({ children:[new Paragraph('Période')]}), new TableCell({ children:[new Paragraph('Budget')]}), ] }), ...actRows ] })
    const delibParas = ((values.deliberations)||[]).length ? [ new Paragraph(''), new Paragraph({ children: [new TextRun({ text: 'Délibérations', bold: true })] }), ...((values.deliberations)||[]).map(d=> new Paragraph(`- ${d.title} [${d.decision}] ${d.text?d.text.slice(0,120)+'...':''}`)) ] : []
    const sigParas = signature ? [ new Paragraph(''), new Paragraph(`Signature: ${signature.name} — ${new Date(signature.at).toLocaleString('fr-FR')} — ID: ${signature.id}`) ] : []
    const doc = new Document({ sections: [{ children: [
      new Paragraph({ children: [new TextRun({ text: `Programme ${id}`, bold: true, size: 28 })], spacing: { after: 200 } }),
      new Paragraph('Objectifs:'), new Paragraph(values.goals||''), actsTable,
      ...delibParas,
      ...sigParas,
    ] }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `programme_${id}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const values = form.getFieldsValue(true)
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(`Programme ${id}`, 14, 16)
    doc.setFontSize(10)
    doc.text('Objectifs:', 14, 24)
    doc.text(doc.splitTextToSize(values.goals||'', 180), 14, 30)
    doc.autoTable({ startY: 50, columns: [ { header: 'Activité', dataKey: 'activity' }, { header: 'Période', dataKey: 'period' }, { header: 'Budget', dataKey: 'budget' } ], body: values.activities||[] })
    let y = ((doc.lastAutoTable && doc.lastAutoTable.finalY) || 60) + 10
    if ((values.deliberations||[]).length) { doc.setFont(undefined,'bold'); doc.text('Délibérations', 14, y); doc.setFont(undefined,'normal'); y+=6; (values.deliberations||[]).forEach(d=>{ doc.text(doc.splitTextToSize(`- ${d.title} [${d.decision}] ${d.text?d.text.slice(0,100)+'...':''}`, 180), 14, y); y+=10 }) }
    if (signature) { y+=6; doc.text(`Signature: ${signature.name} — ${new Date(signature.at).toLocaleString('fr-FR')} — ID: ${signature.id}`, 14, y) }
    doc.save(`programme_${id}.pdf`)
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
      {locked && <Tag color="red">Document verrouillé (définitif)</Tag>}
      <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importJSON} />
      <Space>
        <Button onClick={exportJSON}>Exporter JSON</Button>
        <Button onClick={()=>fileInputRef.current?.click()}>Importer JSON</Button>
        <Button onClick={exportExcel}>Exporter Excel</Button>
        <Button onClick={exportWord}>Exporter Word</Button>
        <Button onClick={exportPDF}>Exporter PDF</Button>
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
      <Card title="Délibérations" style={{ marginTop: 12 }} extra={
        <Space>
          <Input placeholder="Titre" value={delib.title} onChange={e=>setDelib(v=>({...v,title:e.target.value}))} style={{ width: 220 }} />
          <Select value={delib.decision} onChange={(v)=>setDelib(d=>({...d,decision:v}))} style={{ width: 160 }} options={[{value:'Adoptée'},{value:'Rejetée'},{value:'Ajournée'}]} />
          <Input.TextArea placeholder="Texte" value={delib.text} onChange={e=>setDelib(v=>({...v,text:e.target.value}))} rows={1} style={{ width: 260 }} />
          <Button onClick={addDelib}>Ajouter</Button>
        </Space>
      }>
        <List size="small" dataSource={(form.getFieldValue('deliberations')||[])} locale={{emptyText:'Aucune délibération'}} renderItem={(d)=> (
          <List.Item actions={[<Button key="rm" danger size="small" onClick={()=>removeDelib(d.id)}>Supprimer</Button>]}> 
            <List.Item.Meta title={<Space><strong>{d.title}</strong><Tag color={d.decision==='Adoptée'?'green':d.decision==='Rejetée'?'red':'orange'}>{d.decision}</Tag></Space>} description={(d.text||'').slice(0,200)} />
          </List.Item>
        )} />
      </Card>
      <Space>
        <Button type="primary" onClick={doSave} disabled={locked}>Enregistrer</Button>
        <Button onClick={doSubmit} disabled={locked}>Soumettre</Button>
        <Button onClick={doValidate} disabled={locked}>Valider</Button>
        <Button onClick={doSign} disabled={locked}>Signer (démo)</Button>
      </Space>
    </Space>
  )
}

export default ActivitiesProgramEditor