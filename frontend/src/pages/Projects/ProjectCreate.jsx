import React from 'react'
import { Card, Form, Input, Button, Select } from 'antd'
import { useNavigate } from 'react-router-dom'
import { projectsAPI } from '../../services/api'
import { ministryAPI } from '../../services/api'

function ProjectCreate() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [ministries, setMinistries] = React.useState([])

  React.useEffect(()=>{
    ministryAPI.getMinistries().then(res => setMinistries(res.data || [])).catch(()=>setMinistries([]))
  }, [])

  const onFinish = async (values) => {
    await projectsAPI.create(values)
    navigate('/projects')
  }

  return (
    <Card title="Nouveau projet / entité">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Nom du projet" name="name" rules={[{ required: true, message: 'Nom requis' }]}>
          <Input placeholder="Ex: Programme Santé 2025" />
        </Form.Item>
        <Form.Item label="Ministère" name="ministryId">
          <Select allowClear placeholder="Sélectionner" options={(ministries||[]).map(m=>({ value:m.id, label:`${m.name}${m.code?` (${m.code})`:''}` }))} />
        </Form.Item>
        <Form.Item label="Responsable" name="ownerName">
          <Input placeholder="Nom du responsable" />
        </Form.Item>
        <Form.Item label="Objectifs (séparés par virgule)" name="objectives">
          <Input placeholder="Ex: Réduction mortalité, Amélioration couverture" />
        </Form.Item>
        <Form.Item label="Équipe (membres, séparés par virgule)" name="teamNames">
          <Input placeholder="Ex: Alice,Bob,Carla" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Créer</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default ProjectCreate