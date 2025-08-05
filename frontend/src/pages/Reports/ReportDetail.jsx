import React from 'react'
import { Card, Typography, Spin } from 'antd'
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { reportsAPI } from '../../services/api'

const { Title } = Typography

function ReportDetail() {
  const { id } = useParams()
  
  const { data: report, isLoading } = useQuery(
    ['report', id],
    () => reportsAPI.getById(id),
    {
      enabled: !!id,
    }
  )

  if (isLoading) {
    return <Spin size="large" />
  }

  return (
    <div>
      <Title level={2}>Détail du rapport</Title>
      <Card>
        <Title level={3}>{report?.data?.name}</Title>
        <p>{report?.data?.description}</p>
      </Card>
    </div>
  )
}

export default ReportDetail