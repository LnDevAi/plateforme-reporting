import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Table, InputNumber, Space, Typography, Select, DatePicker, message, List, Tag } from 'antd'
import { useParams } from 'react-router-dom'
import { documentsAPI } from '../../services/api'
import WorkflowPanel from '../../components/Workflow/WorkflowPanel'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow, TableCell, WidthType } from 'docx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
// Tag included in the grouped import above

const { Title } = Typography

function PPMEditor() {
  const { id } = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const fileInputRef = React.useRef(null)
  const [locked, setLocked] = useState(false)
  const [delib, setDelib] = useState({ title:'', decision:'Adoptée', text:'' })

  useEffect(() => {
    const run = async () => {
      const res = await documentsAPI.getElaborationItem('ppm', id)
      form.setFieldsValue(res.data)
      setLocked(!!res.data.locked)
      setLoading(false)
    }
    run()
  }, [id])

  const columns = [
    { title: 'Objet', dataIndex: 'subject', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'subject']} noStyle>
        <Input disabled={locked} />
      </Form.Item>
    )},
    { title: 'Procédure', dataIndex: 'procedure', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'procedure']} noStyle>
        <Select disabled={locked} options={[{value:'AO',label:'Appel d’offres'},{value:'DRP',label:'Demande de renseignements et prix'},{value:'AON',label:'AO national'}]} />
      </Form.Item>
    )},
    { title: 'Montant (FCFA)', dataIndex: 'amount', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'amount']} noStyle>
        <InputNumber disabled={locked} min={0} style={{ width: '100%' }} />
      </Form.Item>
    )},
    { title: 'Statut', dataIndex: 'status', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'status']} noStyle>
        <Select disabled={locked} options={[{value:'Planifié'},{value:'Lancé'},{value:'Attribué'},{value:'Annulé'}]} />
      </Form.Item>
    )},
    { title: 'Date prév.', dataIndex: 'planned_date', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'planned_date']} noStyle>
        <DatePicker disabled={locked} style={{ width: '100%' }} />
      </Form.Item>
    )},
    { title: 'Date réelle', dataIndex: 'actual_date', render: (_, __, idx) => (
      <Form.Item name={['lines', idx, 'actual_date']} noStyle>
        <DatePicker disabled={locked} style={{ width: '100%' }} />
      </Form.Item>
    )},
  ]

  const addLine = () => {
    if (locked) return
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
    setLocked(true)
    message.success('Document validé')
  }

  const addDelib = async () => {
    if (!delib.title) return message.info('Titre requis')
    await documentsAPI.addElaborationDeliberation('ppm', id, delib)
    const res = await documentsAPI.getElaborationItem('ppm', id)
    form.setFieldsValue(res.data)
    setDelib({ title:'', decision:'Adoptée', text:'' })
  }
  const removeDelib = async (did) => {
    await documentsAPI.removeElaborationDeliberation('ppm', id, did)
    const res = await documentsAPI.getElaborationItem('ppm', id)
    form.setFieldsValue(res.data)
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

  const exportExcel = () => {
    const values = form.getFieldsValue(true)
    const ws = XLSX.utils.json_to_sheet(values.lines || [])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'PPM')
    XLSX.writeFile(wb, `ppm_${id}.xlsx`)
  }

  const exportWord = async () => {
    const values = form.getFieldsValue(true)
    const rows = (values.lines||[]).map(l => new TableRow({ children: [
      new TableCell({ children: [new Paragraph(l.subject||'')] }),
      new TableCell({ children: [new Paragraph(l.procedure||'')] }),
      new TableCell({ children: [new Paragraph(String(l.amount||0))] }),
      new TableCell({ children: [new Paragraph(l.status||'')] }),
      new TableCell({ children: [new Paragraph((l.planned_date||'').toString())] }),
      new TableCell({ children: [new Paragraph((l.actual_date||'').toString())] }),
    ] }))
    const table = new DocxTable({ rows: [
      new TableRow({ children: [
        new TableCell({ children:[new Paragraph('Objet')]}),
        new TableCell({ children:[new Paragraph('Procédure')]}),
        new TableCell({ children:[new Paragraph('Montant')]}),
        new TableCell({ children:[new Paragraph('Statut')]}),
        new TableCell({ children:[new Paragraph('Date prév.')]}),
        new TableCell({ children:[new Paragraph('Date réelle')]}),
      ]}),
      ...rows,
    ]})
    const doc = new Document({ sections: [{ children: [ new Paragraph({ children: [new TextRun({ text: `PPM ${id}`, bold: true, size: 28 })], spacing: { after: 200 } }), table ] }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ppm_${id}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const values = form.getFieldsValue(true)
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(`PPM ${id}`, 14, 16)
    doc.autoTable({ startY: 24, columns: [
      { header: 'Objet', dataKey: 'subject' },
      { header: 'Procédure', dataKey: 'procedure' },
      { header: 'Montant', dataKey: 'amount' },
      { header: 'Statut', dataKey: 'status' },
      { header: 'Date prév.', dataKey: 'planned_date' },
      { header: 'Date réelle', dataKey: 'actual_date' },
    ], body: values.lines||[] })
    doc.save(`ppm_${id}.pdf`)
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
      {locked && <Tag color="red">Document verrouillé (définitif)</Tag>}
      <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importJSON} />
      <Space>
        <Button onClick={exportJSON}>Exporter JSON</Button>
        <Button onClick={exportCSV}>Exporter CSV (lignes)</Button>
        <Button onClick={()=>fileInputRef.current?.click()}>Importer JSON</Button>
        <Button onClick={exportExcel}>Exporter Excel</Button>
        <Button onClick={exportWord}>Exporter Word</Button>
        <Button onClick={exportPDF}>Exporter PDF</Button>
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
      </Space>
    </Space>
  )
}

export default PPMEditor