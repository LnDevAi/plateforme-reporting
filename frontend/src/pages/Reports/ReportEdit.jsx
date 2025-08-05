import React from 'react'
import { Card, Typography } from 'antd'
import { useParams } from 'react-router-dom'

const { Title } = Typography

function ReportEdit() {
  const { id } = useParams()

  return (
    <div>
      <Title level={2}>Modifier le rapport {id}</Title>
      <Card>
        <p>Page de modification en développement...</p>
      </Card>
    </div>
  )
}

export default ReportEdit