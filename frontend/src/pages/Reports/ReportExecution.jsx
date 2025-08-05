import React from 'react'
import { Card, Typography } from 'antd'
import { useParams } from 'react-router-dom'

const { Title } = Typography

function ReportExecution() {
  const { id } = useParams()

  return (
    <div>
      <Title level={2}>Exécuter le rapport {id}</Title>
      <Card>
        <p>Page d'exécution en développement...</p>
      </Card>
    </div>
  )
}

export default ReportExecution