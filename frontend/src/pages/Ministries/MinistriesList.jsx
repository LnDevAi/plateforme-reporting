import React, { useEffect, useState } from 'react'
import { Button, Card, Form, Input, Modal, Space, Table, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ministryAPI } from '../../services/api'

export default function MinistriesList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

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

  useEffect(() => { load() }, [])

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
      if (editing) {
        await ministryAPI.updateMinistry(editing.id, values)
        message.success('Mis à jour')
      } else {
        await ministryAPI.createMinistry(values)
        message.success('Créé')
      }
      setOpen(false)
      load()
    } catch (e) {
      // validation or API error
    }
  }

  const columns = [
    { title: 'Nom', dataIndex: 'name' },
    { title: 'Code', dataIndex: 'code' },
    { title: 'Email', dataIndex: ['contact','email'] },
    { title: 'Téléphone', dataIndex: ['contact','phone'] },
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
    <Card title="Ministères" extra={<Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>Nouveau</Button>}>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 8 }} />

      <Modal
        title={editing ? 'Modifier le ministère' : 'Créer un ministère'}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
        okText={editing ? 'Enregistrer' : 'Créer'}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nom du ministère" rules={[{ required: true, message: 'Nom requis' }]}>
            <Input placeholder="Ex: Ministère de la Santé" />
          </Form.Item>
          <Form.Item name="code" label="Code">
            <Input placeholder="Ex: MSAN" />
          </Form.Item>
          <Form.Item name={["contact","email"]} label="Email">
            <Input placeholder="contact@ministere.gov" />
          </Form.Item>
          <Form.Item name={["contact","phone"]} label="Téléphone">
            <Input placeholder="Ex: +226 50 00 00 00" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}