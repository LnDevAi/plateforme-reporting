import React, { useState } from 'react'
import { Card, Form, Input, Button, Select, Space, Upload, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { entitiesAPI } from '../../services/api'
import { InboxOutlined } from '@ant-design/icons'

const { Dragger } = Upload

function EntityCreate() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [files, setFiles] = useState([])

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
      const docs = []
      for (const f of files) {
        const content = await readFileAsBase64(f)
        if (content) docs.push({ name: f.name, size: f.size, type: f.type, content })
      }
      const payload = {
        name: values.name,
        type: values.type,
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

  return (
    <Card title="Inscription d'une entité">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="Nom de l'entité" rules={[{ required: true, message: 'Obligatoire' }]}> <Input /> </Form.Item>
        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
          <Select options={[{ value: 'EPE', label: 'EPE' }, { value: 'SocieteEtat', label: "Société d'État" }]} />
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
          <Button type="primary" htmlType="submit">Créer</Button>
        </Space>
      </Form>
    </Card>
  )
}

export default EntityCreate