import React, { useEffect, useState } from 'react'
import { Card, List, Progress, Tag, Button, Space, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { learningAPI } from '../../services/api'

const { Title, Paragraph, Text } = Typography

export default function ELearningHome() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const { data } = await learningAPI.getTracks()
    setTracks(data)
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  return (
    <div>
      <Title level={3}>E‑Learning — Laboratoire de métiers</Title>
      <Paragraph type="secondary">Apprentissage pratique: un peu de théorie, cas pratiques, scénarios, exécution de tâches, quiz et évaluation.</Paragraph>

      <List
        loading={loading}
        grid={{ gutter: 16, column: 2 }}
        dataSource={tracks}
        renderItem={(t)=>(
          <List.Item>
            <Card title={t.title} extra={<Tag>{t.domain}</Tag>}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary">Public: {t.audience}</Text>
                <Paragraph>{t.description}</Paragraph>
                <Space align="center">
                  <Text>Progression</Text>
                  <Progress percent={t.progress || 0} size="small" style={{ minWidth: 180 }} />
                </Space>
                <Space>
                  <Button type="primary" onClick={()=>navigate(`/e-learning/track/${t.id}`)}>Ouvrir</Button>
                </Space>
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </div>
  )
}