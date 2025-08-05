import React from 'react'
import { Card, Typography } from 'antd'
import { useParams } from 'react-router-dom'

const { Title } = Typography

function ScheduleDetail() {
  const { id } = useParams()

  return (
    <div>
      <Title level={2}>Détails de la planification {id}</Title>
      <Card>
        <p>Page de détail de planification en développement...</p>
      </Card>
    </div>
  )
}

export default ScheduleDetail