import React from 'react'
import { Card, Form, Input, Button, Select, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { entitiesAPI } from '../../services/api'

function EntityCreate() {
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    const payload = {
      name: values.name,
      type: values.type,
      tutelle: { technique: values.technique, financier: values.financier },
    }
    const { data } = await entitiesAPI.create(payload)
    navigate(`/entities/${data.id}`)
  }

  return (
    <Card title="Inscription d'une entité">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="Nom de l'entité" rules={[{ required: true, message: 'Obligatoire' }]}> <Input /> </Form.Item>
        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
          <Select options={[{ value: 'EPE', label: 'EPE' }, { value: 'SocieteEtat', label: "Société d'État" }]} />
        </Form.Item>
        <Form.Item name="technique" label="Ministère de tutelle technique" rules={[{ required: true }]}> <Input /> </Form.Item>
        <Form.Item name="financier" label="Ministère de tutelle financier" rules={[{ required: true }]}> <Input /> </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">Créer</Button>
        </Space>
      </Form>
    </Card>
  )
}

export default EntityCreate