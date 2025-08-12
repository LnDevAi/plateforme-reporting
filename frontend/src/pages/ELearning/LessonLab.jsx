import React, { useEffect, useMemo, useState } from 'react'
import { Card, Tabs, Typography, Space, List, Checkbox, Button, Tag, Result, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { learningAPI } from '../../services/api'

const { Title, Paragraph, Text } = Typography

export default function LessonLab() {
  const { id, lessonId } = useParams()
  const navigate = useNavigate()
  const [track, setTrack] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [progress, setProgress] = useState(null)
  const [answers, setAnswers] = useState({})

  const load = async () => {
    const t = await learningAPI.getTrack(id)
    const p = await learningAPI.getProgress(id)
    const l = t.data.modules.flatMap(m=>m.lessons).find(l => l.id === lessonId)
    setTrack(t.data)
    setLesson(l)
    setProgress(p.data)
  }

  useEffect(()=>{ load() }, [id, lessonId])

  const isTaskDone = (taskId) => Boolean(progress?.tasks?.[`${lessonId}:${taskId}`])
  const toggleTask = async (taskId, checked) => { await learningAPI.markTask(id, lessonId, taskId, checked); load() }

  const submitQuiz = async () => {
    const { data } = await learningAPI.submitQuiz(id, lessonId, answers)
    message.success(`Score: ${data.score}%`)
    load()
  }

  const exportAttestation = async () => {
    if (!progress?.eligible) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const left = 60, top = 80
    doc.setFontSize(18); doc.text('Attestation de réussite (Démo)', left, top)
    doc.setFontSize(12)
    doc.text(`Parcours: ${track.title}`, left, top+30)
    doc.text(`Date: ${new Date().toLocaleString('fr-FR')}`, left, top+50)
    doc.text('Cette attestation confirme la réussite des exigences (démo).', left, top+80)
    doc.save(`Attestation_${track.id}.pdf`)
  }

  if (!track || !lesson) return null

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Button onClick={()=>navigate(`/e-learning/track/${track.id}`)}>← Retour au parcours</Button>
      <Title level={3}>{lesson.title}</Title>
      <Text type="secondary">Parcours: {track.title}</Text>

      <Card>
        <Tabs
          defaultActiveKey="overview"
          items={[
            { key: 'overview', label: 'Aperçu', children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph>{track.description}</Paragraph>
                <Paragraph>
                  Compétences visées: {(track.competencies||[]).map(c=> <Tag key={c}>{c}</Tag>)}
                </Paragraph>
                {progress?.eligible ? (
                  <Result status="success" title="Exigences remplies" />
                ) : (
                  <Text type="secondary">Validez 70% des tâches et réussissez les quiz pour être éligible.</Text>
                )}
              </Space>
            )},
            { key: 'theory', label: 'Théorie', children: (
              <Card size="small"><Paragraph>{lesson.theory || '—'}</Paragraph></Card>
            )},
            { key: 'scenarios', label: 'Scénarios', children: (
              <List dataSource={lesson.scenarios||[]} renderItem={(s)=>(
                <List.Item>
                  <List.Item.Meta title={s.title} description={s.description} />
                </List.Item>
              )} />
            )},
            { key: 'tasks', label: 'Tâches', children: (
              <List dataSource={lesson.tasks||[]} renderItem={(t)=>(
                <List.Item actions={[<Checkbox key="cb" checked={isTaskDone(t.id)} onChange={(e)=>toggleTask(t.id, e.target.checked)}>Terminé</Checkbox>] }>
                  <List.Item.Meta title={t.title} />
                </List.Item>
              )} />
            )},
            { key: 'quiz', label: 'Quiz', children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <List dataSource={lesson.quiz?.questions||[]} renderItem={(q)=>(
                  <List.Item>
                    <Space direction="vertical">
                      <Text strong>{q.prompt}</Text>
                      <Space wrap>
                        {(q.options||[]).map(o => (
                          <Button key={o.id} type={answers[q.id]===o.id ? 'primary' : 'default'} onClick={()=>setAnswers({...answers, [q.id]: o.id})}>{o.text}</Button>
                        ))}
                      </Space>
                    </Space>
                  </List.Item>
                )} />
                <Button type="primary" onClick={submitQuiz}>Soumettre le quiz</Button>
                {progress?.quizzes?.[lessonId] && (
                  <Text type="secondary">Dernier score: {progress.quizzes[lessonId].score}%</Text>
                )}
              </Space>
            )},
            { key: 'eval', label: 'Évaluation', children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                {progress?.eligible ? (
                  <Result status="success" title="Éligible à l’attestation" extra={<Button onClick={exportAttestation}>Exporter une attestation (PDF)</Button>} />
                ) : (
                  <Result status="info" title="Poursuivez le laboratoire" subTitle="Complétez les tâches et réussissez les quiz." />
                )}
              </Space>
            )},
          ]}
        />
      </Card>
    </Space>
  )
}