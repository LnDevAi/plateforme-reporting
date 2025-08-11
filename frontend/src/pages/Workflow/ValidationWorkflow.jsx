import React from 'react'
import { Card, Steps, Button, Input, Space } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workflowAPI } from '../../services/api'

function ValidationWorkflow() {
  const qc = useQueryClient()
  const { data } = useQuery(['workflow'], () => workflowAPI.get())
  const mutation = useMutation((wf) => workflowAPI.update(wf), { onSuccess: ()=> qc.invalidateQueries(['workflow']) })

  const workflow = data?.data || { steps: [{ role: 'Éditeur' }, { role: 'Validateur' }] }

  return (
    <Card title="Workflow de validation" extra={<Button onClick={()=>mutation.mutate(workflow)}>Enregistrer</Button>}>
      <Steps direction="vertical" items={workflow.steps.map((s, i) => ({ title: s.role, description: s.note }))} />
      <Space direction="vertical" style={{ marginTop: 16 }}>
        <Input placeholder="Ajouter un niveau (rôle) - démo" />
        <Button>Ajouter (démo)</Button>
      </Space>
    </Card>
  )
}

export default ValidationWorkflow