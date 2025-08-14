import React, { useEffect, useState } from 'react'
import { Button, Card, Form, Input, Modal, Space, Table, message, Upload } from 'antd'
import { InboxOutlined, PlusOutlined, UploadOutlined, CloudUploadOutlined } from '@ant-design/icons'
import { ministryAPI } from '../../services/api'

export default function MinistriesList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()
  const [importText, setImportText] = useState('')
  const [files, setFiles] = useState([])
  const [catalog, setCatalog] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const res = await ministryAPI.getMinistries()
      setData(res.data || [])
    } catch (e) {
      message.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(); ministryAPI.getCatalog().then(res=> setCatalog(res.data||[])).catch(()=>setCatalog([])) }, [])

  const onCreate = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  const onEdit = (record) => {
    setEditing(record)
    form.setFieldsValue(record)
    setOpen(true)
  }

  const onDelete = async (record) => {
    try {
      await ministryAPI.deleteMinistry(record.id)
      message.success('Supprimé')
      load()
    } catch (e) {
      message.error("Suppression impossible")
    }
  }

  const onSubmit = async () => {
    try {
      const values = await form.validateFields()
      values.documents = files.map(f => ({ name: f.name, size: f.size, type: f.type }))
      if (editing) {
        await ministryAPI.updateMinistry(editing.id, values)
        message.success('Mis à jour')
      } else {
        await ministryAPI.createMinistry(values)
        message.success('Créé')
      }
      setOpen(false)
      setFiles([])
      load()
    } catch (e) {
      // validation or API error
    }
  }

  const columns = [
    { title: 'Intitulé', dataIndex: 'name' },
    { title: 'SIGLE', dataIndex: 'code' },
    { title: 'Adresse', dataIndex: 'address' },
    { title: 'Ministre', render: (_, r) => `${r?.minister?.firstName || ''} ${r?.minister?.lastName || ''}`.trim() },
    { title: 'Email', dataIndex: ['contact','email'] },
    { title: 'Téléphone', dataIndex: ['contact','phone'] },
    { title: 'Docs', dataIndex: 'documents', render: (docs=[]) => (docs.length || 0) },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onEdit(record)}>Modifier</Button>
          <Button size="small" danger onClick={() => onDelete(record)}>Supprimer</Button>
        </Space>
      )
    }
  ]

  return (
    <Card title="Ministères" extra={<Space><Button onClick={()=>{ const raw = localStorage.getItem('ministries')||'[]'; const blob = new Blob([raw], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='ministries.json'; a.click(); URL.revokeObjectURL(url) }}>Export JSON</Button><Button icon={<CloudUploadOutlined />} onClick={()=>setImportOpen(true)}>Import JSON</Button><Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>Nouveau</Button></Space>}>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 8 }} />

      <Modal
        title={editing ? 'Modifier le ministère' : 'Créer un ministère'}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
        okText={editing ? 'Enregistrer' : 'Créer'}
      >
        <Form form={form} layout="vertical">
          {(!editing) && (
            <Form.Item label="Catalogue (auto-remplissage)">
              <Input list="ministry-catalog" placeholder="Rechercher un intitulé (catalogue)" onChange={(e)=>{
                const item = catalog.find(c=> c.name === e.target.value)
                if (item) {
                  form.setFieldsValue({ name: item.name, minister: { firstName: item.ministerFullName?.split(' ')[0]||'', lastName: item.ministerFullName?.split(' ').slice(1).join(' ')||'' } })
                }
              }} />
              <datalist id="ministry-catalog">
                {catalog.map((c,idx)=> (<option key={idx} value={c.name}>{c.ministerFullName}</option>))}
              </datalist>
            </Form.Item>
          )}
          <Form.Item name="name" label="Intitulé" rules={[{ required: true, message: 'Intitulé requis' }]}>
            <Input placeholder="Ex: Ministère de la Santé" />
          </Form.Item>
          <Form.Item name="code" label="SIGLE">
            <Input placeholder="Ex: MSAN" />
          </Form.Item>
          <Form.Item name="address" label="Adresse">
            <Input placeholder="Adresse postale/physique" />
          </Form.Item>
          <Form.Item label="Ministre — Prénom">
            <Form.Item name={["minister","firstName"]} noStyle>
              <Input placeholder="Prénom" />
            </Form.Item>
          </Form.Item>
          <Form.Item label="Ministre — Nom">
            <Form.Item name={["minister","lastName"]} noStyle>
              <Input placeholder="Nom" />
            </Form.Item>
          </Form.Item>
          <Form.Item name={["contact","email"]} label="Email">
            <Input placeholder="contact@ministere.gov" />
          </Form.Item>
          <Form.Item name={["contact","phone"]} label="Téléphone">
            <Input placeholder="Ex: +226 50 00 00 00" />
          </Form.Item>
          <Form.Item name="decrees" label="Décrets de création (texte — démo)">
            <Input.TextArea placeholder="Texte libre" rows={3} />
          </Form.Item>
          <Form.Item label="Documents (upload — démo)">
            <Upload.Dragger multiple beforeUpload={(f)=>{ setFiles(prev=>[...prev, f]); return false }} onRemove={(file)=>{ setFiles(prev=>prev.filter(x=>x.uid!==file.uid)) }} fileList={files} accept=".pdf,.doc,.docx,.png,.jpg">
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">Cliquez ou glissez les documents ici</p>
              <p className="ant-upload-hint">PDF/Word/Images (démo: seules les métadonnées sont stockées)</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Import JSON des ministères"
        open={importOpen}
        onCancel={()=>setImportOpen(false)}
        onOk={async()=>{ try { const arr = JSON.parse(importText||'[]'); await ministryAPI.bulkImport(arr); message.success('Importé'); setImportOpen(false); setImportText(''); load() } catch { message.error('JSON invalide') } }}
        okText="Importer"
      >
        <Input.TextArea rows={8} value={importText} onChange={e=>setImportText(e.target.value)} placeholder='[
  {"name":"Ministère 1","code":"M1"},
  {"name":"Ministère 2","code":"M2"}
]'/>
      </Modal>
    </Card>
  )
}