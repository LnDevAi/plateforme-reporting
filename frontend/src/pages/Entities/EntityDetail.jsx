import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Select, Space, Typography, Row, Col } from 'antd'
import { useParams } from 'react-router-dom'
import { entitiesAPI } from '../../services/api'

const { Title } = Typography

function RoleEditor({ label, value, onChange }) {
  return (
    <Space style={{ marginBottom: 8 }}>
      <span style={{ width: 260 }}>{label}</span>
      <Input placeholder="Nom Prénom" value={value?.name} onChange={(e)=>onChange({ ...(value||{}), name: e.target.value })} />
      <Input placeholder="Matricule" value={value?.matricule} onChange={(e)=>onChange({ ...(value||{}), matricule: e.target.value })} />
      <Input placeholder="Contact" value={value?.contact} onChange={(e)=>onChange({ ...(value||{}), contact: e.target.value })} />
      <Input placeholder="Email" value={value?.email} onChange={(e)=>onChange({ ...(value||{}), email: e.target.value })} />
    </Space>
  )
}

function EntityDetail() {
  const { id } = useParams()
  const [entity, setEntity] = useState(null)

  const load = async () => {
    const { data } = await entitiesAPI.getById(id)
    setEntity(data)
  }

  useEffect(()=>{ load() }, [id])

  const save = async () => {
    await entitiesAPI.saveById(id, entity)
  }

  if (!entity) return <Card>Chargement...</Card>

  const dg = entity.structure.directionGenerale
  const ca = entity.structure.conseilAdministration
  const ag = entity.structure.assembleeGenerale

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={3}>{entity.name} ({entity.type})</Title>
      <Card title="Tutelle">
        <Row gutter={12}>
          <Col span={12}><b>Technique:</b> {entity.tutelle?.technique || '-'}</Col>
          <Col span={12}><b>Financier:</b> {entity.tutelle?.financier || '-'}</Col>
        </Row>
      </Card>

      <Card title="Direction Générale">
        <RoleEditor label="Directeur Général (DG)" value={dg.roles.DG} onChange={(v)=>{ dg.roles.DG = v; setEntity({ ...entity }) }} />
        <RoleEditor label="Directeur Finances/Comptabilité (DFC)" value={dg.roles.DFC} onChange={(v)=>{ dg.roles.DFC = v; setEntity({ ...entity }) }} />
        <RoleEditor label="Personne Responsable des Marchés (PRM)" value={dg.roles.PRM} onChange={(v)=>{ dg.roles.PRM = v; setEntity({ ...entity }) }} />
        <RoleEditor label="Directeur des Ressources Humaines (DRH)" value={dg.roles.DRH} onChange={(v)=>{ dg.roles.DRH = v; setEntity({ ...entity }) }} />
        <RoleEditor label="Contrôleur de Gestion (C-G)" value={dg.roles.CG} onChange={(v)=>{ dg.roles.CG = v; setEntity({ ...entity }) }} />
        <RoleEditor label="Auditeur Interne (AI)" value={dg.roles.AI} onChange={(v)=>{ dg.roles.AI = v; setEntity({ ...entity }) }} />
      </Card>

      <Card title="Conseil d'Administration">
        {ca.ministeres.map((m, idx) => (
          <RoleEditor key={idx} label={m.slot} value={m.membre} onChange={(v)=>{ ca.ministeres[idx].membre = v; setEntity({ ...entity }) }} />
        ))}
        <RoleEditor label="Observateur 1" value={ca.observateurs[0]} onChange={(v)=>{ ca.observateurs[0]=v; setEntity({ ...entity }) }} />
        <RoleEditor label="Observateur 2" value={ca.observateurs[1]} onChange={(v)=>{ ca.observateurs[1]=v; setEntity({ ...entity }) }} />
        <RoleEditor label="Représentant du Personnel" value={ca.repPersonnel} onChange={(v)=>{ ca.repPersonnel=v; setEntity({ ...entity }) }} />
        <RoleEditor label="Commissaire aux Comptes" value={ca.commissaireComptes} onChange={(v)=>{ ca.commissaireComptes=v; setEntity({ ...entity }) }} />
      </Card>

      <Card title="Assemblée Générale">
        <Input.TextArea rows={3} value={ag.notes} onChange={(e)=>{ ag.notes = e.target.value; setEntity({ ...entity }) }} />
      </Card>

      <Space>
        <Button type="primary" onClick={save}>Enregistrer</Button>
      </Space>
    </Space>
  )
}

export default EntityDetail