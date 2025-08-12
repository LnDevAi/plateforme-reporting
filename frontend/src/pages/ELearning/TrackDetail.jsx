import React, { useEffect, useState } from 'react'
import { Card, List, Tag, Space, Typography, Button, Progress, Result } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { learningAPI } from '../../services/api'

const { Title, Paragraph, Text } = Typography

export default function TrackDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [track, setTrack] = useState(null)
  const [progress, setProgress] = useState(null)

  const load = async () => {
    const t = await learningAPI.getTrack(id)
    const p = await learningAPI.getProgress(id)
    setTrack(t.data)
    setProgress(p.data)
  }

  useEffect(()=>{ load() }, [id])

  if (!track) return null

  const firstLessonId = track.modules?.[0]?.lessons?.[0]?.id

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={3}>{track.title}</Title>
        <Text type="secondary">Domaine: {track.domain} • Public: {track.audience}</Text>
        <Paragraph>{track.description}</Paragraph>

        {progress?.eligible ? (
          <Result status="success" title="Prêt pour l’attestation" subTitle="Vous avez validé les exigences (tâches et quiz)." />
        ) : (
          <Text type="secondary">Objectif: valider au moins 70% des tâches et réussir les quiz.</Text>
        )}

        <Card title="Modules">
          <List
            dataSource={track.modules}
            renderItem={(m)=> (
              <List.Item>
                <List.Item.Meta title={<Space><strong>{m.title}</strong><Tag color="blue">{(m.lessons||[]).length} leçon(s)</Tag></Space>} />
                <Space>
                  {(m.lessons||[]).map((l)=> (
                    <Button key={l.id} onClick={()=>navigate(`/e-learning/track/${track.id}/lesson/${l.id}`)}>{l.title}</Button>
                  ))}
                </Space>
              </List.Item>
            )}
          />
        </Card>

        {firstLessonId && (
          <Space>
            <Button type="primary" onClick={()=>navigate(`/e-learning/track/${track.id}/lesson/${firstLessonId}`)}>Commencer le laboratoire</Button>
          </Space>
        )}
      </Space>
    </div>
  )
}