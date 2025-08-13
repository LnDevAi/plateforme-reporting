import React, { useEffect, useState, useRef } from 'react'
import { Card, Button, Table, Tag, Space, Modal, Form, Input, Select, message, Typography, List } from 'antd'
import { documentsAPI } from '../../services/api'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph } from 'docx'

const { Title } = Typography

export default function ReportsOthers() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [creating] = Form.useForm()
  const [form] = Form.useForm()
  const [currentId, setCurrentId] = useState(null)
  const fileInputRef = useRef(null)
  const [delib, setDelib] = useState({ title:'', decision:'Adoptée', text:'' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await documentsAPI.getOthers()
      setList(res.data || [])
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const create = async () => {
    try {
      const values = await creating.validateFields()
      const res = await documentsAPI.createOther(values)
      setOpen(false)
      creating.resetFields()
      setList(prev => [res.data, ...prev])
      message.success('Créé')
    } catch {}
  }

  const openEditor = async (id) => {
    const res = await documentsAPI.getOtherItem(id)
    setCurrentId(id)
    form.setFieldsValue(res.data)
    setEditorOpen(true)
  }

  const save = async () => {
    const values = form.getFieldsValue(true)
    await documentsAPI.saveOtherItem(currentId, values)
    message.success('Enregistré')
    load()
  }
  const submit = async () => { await save(); await documentsAPI.submitOtherItem(currentId); message.success('Soumis'); load() }
  const validate = async () => { await documentsAPI.validateOtherItem(currentId); message.success('Validé'); load(); setEditorOpen(false) }

  const exportPDF = () => {
    const values = form.getFieldsValue(true)
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(values.title || `Autre ${currentId}`, 14, 16)
    doc.setFontSize(11)
    doc.text('Résumé:', 14, 26)
    doc.text(doc.splitTextToSize(values.summary||'', 180), 14, 34)
    const y = 34 + (doc.splitTextToSize(values.summary||'', 180).length * 6) + 6
    doc.text('Contenu:', 14, y)
    doc.text(doc.splitTextToSize(values.content||'', 180), 14, y + 8)
    doc.save(`autre_${currentId}.pdf`)
  }

  const exportWord = async () => {
    const values = form.getFieldsValue(true)
    const lines = `${values.title || `Autre ${currentId}`}\n\nRésumé:\n${values.summary||''}\n\nContenu:\n${values.content||''}`.split('\n')
    const paragraphs = lines.map(l => new Paragraph(l))
    const doc = new Document({ sections: [{ children: paragraphs }] })
    const blob = await Packer.toBlob(doc)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `autre_${currentId}.docx`
    document.body.appendChild(a); a.click(); a.remove()
  }

  const importJSON = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const json = JSON.parse(text)
      form.setFieldsValue(json)
      await documentsAPI.saveOtherItem(currentId, json)
      message.success('Import réussi')
    } catch { message.error('JSON invalide') }
    finally { e.target.value=''}
  }

  const addDelib = async () => {
    if (!delib.title) return message.info('Titre requis')
    await documentsAPI.addOtherDeliberation(currentId, delib)
    const res = await documentsAPI.getOtherItem(currentId)
    form.setFieldsValue(res.data)
    setDelib({ title:'', decision:'Adoptée', text:'' })
  }
  const removeDelib = async (id) => {
    await documentsAPI.removeOtherDeliberation(currentId, id)
    const res = await documentsAPI.getOtherItem(currentId)
    form.setFieldsValue(res.data)
  }

  const columns = [
    { title: 'Titre', dataIndex: 'title' },
    { title: 'Statut', dataIndex: 'status', render: (s)=> <Tag color={s==='Validé'?'green':s==='Soumis'?'blue':'orange'}>{s}</Tag> },
    { title: 'Mise à jour', dataIndex: 'updated_at' },
    { title: 'Actions', render: (_, r) => <Button onClick={()=>openEditor(r.id)}>Ouvrir</Button> },
  ]

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card title={<Space><Title level={4} style={{margin:0}}>Autres rapports</Title></Space>} extra={<Button onClick={()=>setOpen(true)}>Nouveau</Button>}>
        <Table loading={loading} dataSource={list} columns={columns} rowKey={(r)=>r.id} pagination={false} />
      </Card>

      <Modal title="Nouveau document" open={open} onCancel={()=>setOpen(false)} onOk={create} okText="Créer">
        <Form form={creating} layout="vertical">
          <Form.Item name="title" label="Titre" rules={[{ required:true, message:'Titre requis' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Catégorie">
            <Select allowClear options={[{value:'Général'},{value:'Stratégie'},{value:'Financier'},{value:'Social'}]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal width={900} title="Édition du document" open={editorOpen} onCancel={()=>setEditorOpen(false)} footer={null}>
        <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importJSON} />
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Button onClick={save}>Enregistrer</Button>
            <Button onClick={submit}>Soumettre</Button>
            <Button onClick={validate}>Valider</Button>
            <Button onClick={()=>fileInputRef.current?.click()}>Importer JSON</Button>
            <Button onClick={exportWord}>Exporter Word</Button>
            <Button onClick={exportPDF}>Exporter PDF</Button>
          </Space>
          <Form form={form} layout="vertical">
            <Form.Item name="title" label="Titre">
              <Input />
            </Form.Item>
            <Form.Item name="category" label="Catégorie">
              <Select allowClear options={[{value:'Général'},{value:'Stratégie'},{value:'Financier'},{value:'Social'}]} />
            </Form.Item>
            <Form.Item name="summary" label="Résumé">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="content" label="Contenu">
              <Input.TextArea rows={8} />
            </Form.Item>
            <Card title="Délibérations" extra={
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
          </Form>
        </Space>
      </Modal>
    </Space>
  )
}