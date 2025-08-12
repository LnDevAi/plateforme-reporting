import React, { useEffect, useState } from 'react'
import { Card, Typography, Table, Button, Space, Modal, Form, Input, Select, message } from 'antd'

const { Title } = Typography

const ROLE_OPTIONS = [
  { value: 'DG', label: 'Directeur Général' },
  { value: 'DFC', label: 'Directeur Finances/Comptabilité' },
  { value: 'PRM', label: 'Personne Responsable des Marchés' },
  { value: 'DRH', label: 'Directeur des Ressources Humaines' },
  { value: 'CG', label: 'Contrôleur de Gestion' },
  { value: 'AI', label: 'Auditeur Interne' },
  { value: 'ADMIN_CA', label: "Administrateur (Conseil d'Administration)" },
  { value: 'OBS', label: 'Observateur' },
  { value: 'REP_PERS', label: 'Représentant du Personnel' },
  { value: 'COMMISSAIRE', label: 'Commissaire aux Comptes' },
]

function UsersList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    const raw = localStorage.getItem('users')
    setData(raw ? JSON.parse(raw) : [])
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  const saveAll = (list) => localStorage.setItem('users', JSON.stringify(list))

  const onCreate = () => {
    form.resetFields()
    setOpen(true)
  }

  const onEdit = (record) => {
    form.setFieldsValue(record)
    setOpen(true)
  }

  const onDelete = (id) => {
    const list = data.filter(u => u.id !== id)
    setData(list)
    saveAll(list)
  }

  const onSubmit = () => {
    form.validateFields().then(values => {
      let list = [...data]
      if (values.id) {
        list = list.map(u => u.id === values.id ? { ...u, ...values } : u)
      } else {
        list.push({ id: Date.now(), ...values })
      }
      setData(list)
      saveAll(list)
      setOpen(false)
      message.success('Utilisateur enregistré')
    })
  }

  const columns = [
    { title: 'Nom', dataIndex: 'name', key: 'name' },
    { title: 'Prénom', dataIndex: 'surname', key: 'surname' },
    { title: 'Matricule', dataIndex: 'matricule', key: 'matricule' },
    { title: 'Contact', dataIndex: 'contact', key: 'contact' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Rôle', dataIndex: 'role', key: 'role', render: (r)=> ROLE_OPTIONS.find(x=>x.value===r)?.label || r },
    { title: 'Actions', key: 'actions', render: (_, record) => (
      <Space>
        <Button onClick={()=>onEdit(record)}>Modifier</Button>
        <Button danger onClick={()=>onDelete(record.id)}>Supprimer</Button>
      </Space>
    )},
  ]

  return (
    <div>
      <Title level={2}>Gestion des utilisateurs</Title>
      <Card extra={<Button type="primary" onClick={onCreate}>Nouvel utilisateur</Button>}>
        <Table loading={loading} dataSource={data} columns={columns} rowKey={(r)=>r.id} />
      </Card>

      <Modal open={open} onCancel={()=>setOpen(false)} onOk={onSubmit} title="Utilisateur">
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden><Input /></Form.Item>
          <Form.Item name="name" label="Nom" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="surname" label="Prénom" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="matricule" label="Matricule"><Input /></Form.Item>
          <Form.Item name="contact" label="Contact"><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', required: true }]}><Input /></Form.Item>
          <Form.Item name="role" label="Rôle" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} showSearch optionFilterProp="label" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UsersList