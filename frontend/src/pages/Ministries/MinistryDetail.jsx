import React, { useEffect, useState } from 'react'
import { Card, Descriptions, Form, Input, Button, message } from 'antd'
import { useParams } from 'react-router-dom'
import { ministryAPI } from '../../services/api'

export default function MinistryDetail() {
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const res = await ministryAPI.getMinistry(id)
      setData(res.data)
      form.setFieldsValue(res.data)
    } catch (e) {
      message.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const save = async () => {
    try {
      const values = await form.validateFields()
      await ministryAPI.updateMinistry(id, values)
      message.success('Enregistré')
      load()
    } catch (e) {}
  }

  if (!data) return <Card loading={loading} />

  return (
    <Card title={`Ministère: ${data?.name || ''}`} extra={<Button type="primary" onClick={save}>Enregistrer</Button>}>
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Intitulé" rules={[{ required: true, message: 'Intitulé requis' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="code" label="SIGLE">
          <Input />
        </Form.Item>
        <Form.Item name="address" label="Adresse">
          <Input />
        </Form.Item>
        <Descriptions title="Contact" bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Email">
            <Form.Item name={["contact","email"]} style={{ margin: 0 }}>
              <Input placeholder="Email" />
            </Form.Item>
          </Descriptions.Item>
          <Descriptions.Item label="Téléphone">
            <Form.Item name={["contact","phone"]} style={{ margin: 0 }}>
              <Input placeholder="Téléphone" />
            </Form.Item>
          </Descriptions.Item>
        </Descriptions>
        <Descriptions title="Ministre" bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Prénom">
            <Form.Item name={["minister","firstName"]} style={{ margin: 0 }}>
              <Input placeholder="Prénom" />
            </Form.Item>
          </Descriptions.Item>
          <Descriptions.Item label="Nom">
            <Form.Item name={["minister","lastName"]} style={{ margin: 0 }}>
              <Input placeholder="Nom" />
            </Form.Item>
          </Descriptions.Item>
        </Descriptions>
        <Form.Item name="decrees" label="Décrets de création (liens ou noms — démo)">
          <Input.TextArea rows={4} placeholder="Liste séparée par des virgules" />
        </Form.Item>
      </Form>
    </Card>
  )
}