import React, { useState } from 'react'
import { Card, Form, Input, Button, Select, Space, Upload, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { entitiesAPI } from '../../services/api'
import { ministryAPI } from '../../services/api'
import { InboxOutlined } from '@ant-design/icons'

const { Dragger } = Upload

function EntityCreate() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [nameValue, setNameValue] = useState('')
  const [ministries, setMinistries] = useState([])

  React.useEffect(()=>{
    ministryAPI.getMinistries().then(res=> setMinistries(res.data || [])).catch(()=>setMinistries([]))
  }, [])

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    try {
      const raw = file?.originFileObj || file
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(raw)
    } catch (e) {
      resolve(null)
    }
  })

  const onFinish = async (values) => {
    try {
      const nameTrimmed = (nameValue || '').trim()
      if (!nameTrimmed) {
        message.error("Veuillez saisir le nom de l'entité")
        return
      }
      const docs = []
      for (const f of files) {
        // Stockage démo: uniquement les métadonnées, pas le contenu (évite dépassement de quota localStorage)
        docs.push({ name: f.name, size: f.size, type: f.type })
      }
      const payload = {
        name: nameTrimmed,
        type: values.type || 'EPE',
        ministryId: values.ministryId || null,
        tutelle: { technique: values.technique, financier: values.financier },
        contact: {
          adresse: values.adresse || '',
          telephone: values.telephone || '',
          email: values.email || '',
        },
        identification: {
          ifu: values.ifu || '',
          cnss: values.cnss || '',
          rccm: values.rccm || '',
        },
        autresInformations: values.autres || '',
        documentsCreation: docs,
      }
      const { data } = await entitiesAPI.create(payload)
      message.success('Entité créée')
      navigate(`/entities/${data.id}`)
    } catch (e) {
      console.error(e)
      message.error("Erreur lors de la création de l'entité")
    }
  }

  const handleCreate = async () => {
    const values = form.getFieldsValue(true)
    await onFinish(values)
  }

  return (
    <Card title="Inscription d'une entité">
      <Form form={form} layout="vertical">
        <Form.Item label="Nom de l'entité">
          <Input autoFocus placeholder="Ex: Société X" autoComplete="off" value={nameValue} onChange={(e)=>setNameValue(e.target.value)} />
        </Form.Item>
        <Form.Item name="type" label="Type">
          <Select allowClear placeholder="Choisir" options={[{ value: 'EPE', label: 'EPE' }, { value: 'SocieteEtat', label: "Société d'État" }]} />
        </Form.Item>
        <Form.Item name="ministryId" label="Ministère">
          <Select
            allowClear
            placeholder="Sélectionner un ministère"
            options={(ministries||[]).map(m=>({ value: m.id, label: `${m.name}${m.code?` (${m.code})`:''}` }))}
          />
        </Form.Item>
        <Form.Item name="technique" label="Ministère de tutelle technique"> <Input /> </Form.Item>
        <Form.Item name="financier" label="Ministère de tutelle financier"> <Input /> </Form.Item>

        <Form.Item name="adresse" label="Adresse"> <Input /> </Form.Item>
        <Form.Item name="telephone" label="Téléphone"> <Input /> </Form.Item>
        <Form.Item name="email" label="Email"> <Input type="email" /> </Form.Item>

        <Form.Item name="ifu" label="IFU"> <Input /> </Form.Item>
        <Form.Item name="cnss" label="CNSS"> <Input /> </Form.Item>
        <Form.Item name="rccm" label="RCCM"> <Input /> </Form.Item>

        <Form.Item name="autres" label="Autres informations"> <Input.TextArea rows={3} /> </Form.Item>

        <Form.Item label="Documents de création (optionnel)">
          <Dragger multiple beforeUpload={(f)=>{ setFiles(prev=>[...prev, f]); return false }} onRemove={(file)=>{ setFiles(prev=>prev.filter(x=>x.uid!==file.uid)); }} fileList={files} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg">
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Cliquez ou glissez vos documents ici</p>
            <p className="ant-upload-hint">PDF, Word, images. (Démo: stocké localement)</p>
          </Dragger>
        </Form.Item>

        <Space>
          <Button type="primary" onClick={handleCreate}>Créer</Button>
        </Space>
      </Form>
    </Card>
  )
}

export default EntityCreate