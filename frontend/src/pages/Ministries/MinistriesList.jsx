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
    { title: 'Intitulé', dataIndex: 'name' },
    { title: 'SIGLE', dataIndex: 'code' },
    { title: 'Adresse', dataIndex: 'address' },
    { title: 'Ministre', render: (_, r) => `${r?.minister?.firstName || ''} ${r?.minister?.lastName || ''}`.trim() },
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
          <Form.Item name="decrees" label="Décrets de création (liens ou noms — démo)">
            <Input.TextArea placeholder="Saisir une liste de liens ou de noms de fichiers, séparés par des virgules" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}