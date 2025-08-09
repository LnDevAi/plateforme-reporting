import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Layout,
  Row,
  Col,
  Card,
  Button,
  Typography,
  Space,
  Avatar,
  Badge,
  Progress,
  Tabs,
  List,
  Input,
  Select,
  Modal,
  Form,
  message,
  Tooltip,
  Tag,
  Statistic,
  Timeline,
  Divider,
  Alert,
  Drawer,
  Radio,
  Checkbox,
  Comment,
  Collapse,
  Spin,
} from 'antd'
import {
  VideoCameraOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  PhoneOutlined,
  ShareAltOutlined,
  MessageOutlined,
  TeamOutlined,
  FileTextOutlined,
  VoteOutlined,
  RecordOutlined,
  FullscreenOutlined,
  SettingOutlined,
  HandRaiseOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CameraOutlined,
  MicrophoneOutlined,
  DesktopOutlined,
  UserOutlined,
  CrownOutlined,
  EyeOutlined,
  SoundOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import './SessionRoom.css'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { TextArea } = Input
const { Option } = Select
const { Panel } = Collapse

function SessionRoom() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // États de la session
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [activeTab, setActiveTab] = useState('participants')
  const [chatMessage, setChatMessage] = useState('')
  const [selectedVote, setSelectedVote] = useState(null)
  const [voteResponse, setVoteResponse] = useState({})

  // États des modales
  const [voteModalVisible, setVoteModalVisible] = useState(false)
  const [documentsDrawerVisible, setDocumentsDrawerVisible] = useState(false)
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false)

  // Références
  const localVideoRef = useRef()
  const remoteVideoRef = useRef()
  const chatContainerRef = useRef()

  // Récupérer les données de la session
  const { data: sessionData, isLoading } = useQuery(
    ['session', sessionId],
    () => sessionAPI.getSession(sessionId),
    {
      refetchInterval: 5000, // Actualiser toutes les 5 secondes
    }
  )

  // Récupérer les participants
  const { data: participantsData } = useQuery(
    ['session-participants', sessionId],
    () => sessionAPI.getParticipants(sessionId),
    {
      refetchInterval: 3000,
    }
  )

  // Récupérer les votes actifs
  const { data: votesData } = useQuery(
    ['session-votes', sessionId],
    () => sessionAPI.getVotes(sessionId),
    {
      refetchInterval: 2000,
    }
  )

  // Récupérer les messages de chat
  const { data: chatData } = useQuery(
    ['session-chat', sessionId],
    () => sessionAPI.getChatMessages(sessionId),
    {
      refetchInterval: 1000,
    }
  )

  // Mutations
  const joinSessionMutation = useMutation(sessionAPI.joinSession, {
    onSuccess: () => {
      message.success('Vous avez rejoint la session')
      queryClient.invalidateQueries(['session-participants', sessionId])
    }
  })

  const sendChatMutation = useMutation(sessionAPI.sendChatMessage, {
    onSuccess: () => {
      setChatMessage('')
      queryClient.invalidateQueries(['session-chat', sessionId])
    }
  })

  const castVoteMutation = useMutation(sessionAPI.castVote, {
    onSuccess: () => {
      message.success('Vote enregistré avec succès')
      setVoteModalVisible(false)
      setVoteResponse({})
      queryClient.invalidateQueries(['session-votes', sessionId])
    }
  })

  // Initialiser la connexion WebRTC
  useEffect(() => {
    if (sessionData?.data && user) {
      initializeWebRTC()
      joinSession()
    }
  }, [sessionData, user])

  // Auto-scroll du chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatData])

  const initializeWebRTC = async () => {
    try {
      // Demander l'accès à la caméra et au micro
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      })

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Initialiser la connexion WebRTC ici
      // (Implémentation spécifique selon la solution choisie: Jitsi, WebRTC native, etc.)
      
    } catch (error) {
      console.error('Erreur d\'accès aux médias:', error)
      message.error('Impossible d\'accéder à la caméra/microphone')
    }
  }

  const joinSession = () => {
    if (!sessionData?.data?.id) return

    joinSessionMutation.mutate({
      sessionId: sessionData.data.id,
      participantInfo: {
        name: user.name,
        email: user.email,
        role: user.role,
      }
    })
  }

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled)
    // Logique WebRTC pour activer/désactiver la vidéo
  }

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled)
    // Logique WebRTC pour activer/désactiver l'audio
  }

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing)
    // Logique WebRTC pour partage d'écran
  }

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised)
    // Notifier le président de séance
  }

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return

    sendChatMutation.mutate({
      sessionId,
      message: chatMessage,
      type: 'chat'
    })
  }

  const handleVoteSubmit = () => {
    if (!selectedVote || !voteResponse[selectedVote.id]) {
      message.warning('Veuillez sélectionner une réponse')
      return
    }

    castVoteMutation.mutate({
      voteId: selectedVote.id,
      response: voteResponse[selectedVote.id]
    })
  }

  // Rendu de la zone vidéo principale
  const renderVideoArea = () => (
    <Card className="video-container" style={{ height: '500px' }}>
      <div className="video-grid">
        {/* Vidéo du président ou de l'orateur principal */}
        <div className="main-video">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="video-overlay">
            <div className="speaker-info">
              <Avatar icon={<CrownOutlined />} />
              <Text strong style={{ color: 'white', marginLeft: '8px' }}>
                {sessionData?.data?.president?.name || 'Président de séance'}
              </Text>
            </div>
            {sessionData?.data?.is_recording && (
              <Badge
                count={<RecordOutlined style={{ color: 'red' }} />}
                style={{ position: 'absolute', top: '10px', right: '10px' }}
              />
            )}
          </div>
        </div>

        {/* Vidéos des autres participants */}
        <div className="participants-videos">
          {participantsData?.data?.slice(0, 6).map((participant) => (
            <div key={participant.id} className="participant-video">
              <div className="participant-avatar">
                <Avatar
                  size={64}
                  src={participant.user.avatar}
                  style={{ 
                    backgroundColor: participant.status === 'present' ? '#52c41a' : '#d9d9d9' 
                  }}
                >
                  {participant.user.name.charAt(0)}
                </Avatar>
                {participant.is_speaking && (
                  <SoundOutlined className="speaking-indicator" />
                )}
              </div>
              <Text className="participant-name">{participant.user.name}</Text>
              {participant.has_voting_rights && (
                <VoteOutlined className="voting-rights-indicator" />
              )}
            </div>
          ))}
        </div>

        {/* Vidéo locale */}
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
            style={{ 
              width: '200px', 
              height: '150px', 
              objectFit: 'cover',
              display: isVideoEnabled ? 'block' : 'none'
            }}
          />
          {!isVideoEnabled && (
            <div className="video-placeholder">
              <Avatar size={64} icon={<UserOutlined />} />
              <Text>Caméra désactivée</Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  )

  // Rendu des contrôles vidéo
  const renderVideoControls = () => (
    <Card className="video-controls">
      <Row justify="center" gutter={[16, 16]}>
        <Col>
          <Tooltip title={isVideoEnabled ? "Désactiver la caméra" : "Activer la caméra"}>
            <Button
              type={isVideoEnabled ? "primary" : "default"}
              shape="circle"
              size="large"
              icon={<VideoCameraOutlined />}
              onClick={toggleVideo}
            />
          </Tooltip>
        </Col>
        <Col>
          <Tooltip title={isAudioEnabled ? "Couper le micro" : "Activer le micro"}>
            <Button
              type={isAudioEnabled ? "primary" : "default"}
              shape="circle"
              size="large"
              icon={isAudioEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
              onClick={toggleAudio}
            />
          </Tooltip>
        </Col>
        <Col>
          <Tooltip title="Partager l'écran">
            <Button
              type={isScreenSharing ? "primary" : "default"}
              shape="circle"
              size="large"
              icon={<DesktopOutlined />}
              onClick={toggleScreenShare}
            />
          </Tooltip>
        </Col>
        <Col>
          <Tooltip title="Lever la main">
            <Button
              type={isHandRaised ? "primary" : "default"}
              shape="circle"
              size="large"
              icon={<HandRaiseOutlined />}
              onClick={toggleHandRaise}
              style={{ color: isHandRaised ? '#faad14' : undefined }}
            />
          </Tooltip>
        </Col>
        <Col>
          <Tooltip title="Documents">
            <Button
              shape="circle"
              size="large"
              icon={<FileTextOutlined />}
              onClick={() => setDocumentsDrawerVisible(true)}
            />
          </Tooltip>
        </Col>
        <Col>
          <Tooltip title="Paramètres">
            <Button
              shape="circle"
              size="large"
              icon={<SettingOutlined />}
              onClick={() => setSettingsDrawerVisible(true)}
            />
          </Tooltip>
        </Col>
        <Col>
          <Tooltip title="Quitter la session">
            <Button
              danger
              shape="circle"
              size="large"
              icon={<PhoneOutlined />}
              onClick={() => navigate('/sessions')}
            />
          </Tooltip>
        </Col>
      </Row>
    </Card>
  )

  // Rendu du panneau latéral
  const renderSidePanel = () => (
    <Card className="side-panel" style={{ height: '100%' }}>
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'participants',
            label: (
              <Space>
                <TeamOutlined />
                <span>Participants</span>
                <Badge count={participantsData?.data?.length || 0} />
              </Space>
            ),
            children: renderParticipantsList()
          },
          {
            key: 'chat',
            label: (
              <Space>
                <MessageOutlined />
                <span>Discussion</span>
                <Badge count={chatData?.data?.unread_count || 0} />
              </Space>
            ),
            children: renderChatPanel()
          },
          {
            key: 'votes',
            label: (
              <Space>
                <VoteOutlined />
                <span>Votes</span>
                <Badge 
                  count={votesData?.data?.filter(v => v.status === 'open').length || 0}
                  status="processing"
                />
              </Space>
            ),
            children: renderVotesPanel()
          },
          {
            key: 'agenda',
            label: (
              <Space>
                <ClockCircleOutlined />
                <span>Ordre du jour</span>
              </Space>
            ),
            children: renderAgendaPanel()
          }
        ]}
      />
    </Card>
  )

  // Rendu de la liste des participants
  const renderParticipantsList = () => (
    <div className="participants-list">
      <div className="participants-stats">
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="Présents"
              value={participantsData?.data?.filter(p => p.status === 'present').length || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Quorum"
              value={sessionData?.data?.quorum_achieved ? "Atteint" : "Non atteint"}
              valueStyle={{ color: sessionData?.data?.quorum_achieved ? '#52c41a' : '#f5222d' }}
            />
          </Col>
        </Row>
      </div>

      <Divider />

      <List
        dataSource={participantsData?.data || []}
        renderItem={(participant) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Badge 
                  status={participant.status === 'present' ? 'success' : 'default'}
                  dot
                >
                  <Avatar 
                    src={participant.user.avatar}
                    style={{ backgroundColor: getParticipantColor(participant.role) }}
                  >
                    {participant.user.name.charAt(0)}
                  </Avatar>
                </Badge>
              }
              title={
                <Space>
                  <Text strong>{participant.user.name}</Text>
                  {participant.role === 'president' && <CrownOutlined style={{ color: '#faad14' }} />}
                  {participant.has_voting_rights && <VoteOutlined style={{ color: '#1890ff' }} />}
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary">{getParticipantRoleLabel(participant.role)}</Text>
                  {participant.is_hand_raised && (
                    <Tag color="orange" icon={<HandRaiseOutlined />}>
                      Main levée
                    </Tag>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )

  // Rendu du panel de chat
  const renderChatPanel = () => (
    <div className="chat-panel">
      <div 
        className="chat-messages" 
        ref={chatContainerRef}
        style={{ height: '400px', overflowY: 'auto', marginBottom: '16px' }}
      >
        {chatData?.data?.map((message) => (
          <Comment
            key={message.id}
            author={<Text strong>{message.user.name}</Text>}
            avatar={<Avatar src={message.user.avatar}>{message.user.name.charAt(0)}</Avatar>}
            content={<Text>{message.content}</Text>}
            datetime={
              <Tooltip title={new Date(message.created_at).toLocaleString()}>
                <Text type="secondary">{formatMessageTime(message.created_at)}</Text>
              </Tooltip>
            }
            className={message.type === 'system' ? 'system-message' : 'user-message'}
          />
        ))}
      </div>

      <div className="chat-input">
        <Input.Group compact>
          <Input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Tapez votre message..."
            onPressEnter={sendChatMessage}
            style={{ width: 'calc(100% - 40px)' }}
          />
          <Button 
            type="primary" 
            icon={<SendOutlined />}
            onClick={sendChatMessage}
            loading={sendChatMutation.isLoading}
          />
        </Input.Group>
      </div>
    </div>
  )

  // Rendu du panel de votes
  const renderVotesPanel = () => (
    <div className="votes-panel">
      <List
        dataSource={votesData?.data || []}
        renderItem={(vote) => (
          <List.Item
            actions={[
              vote.status === 'open' && (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    setSelectedVote(vote)
                    setVoteModalVisible(true)
                  }}
                  disabled={vote.user_has_voted}
                >
                  {vote.user_has_voted ? 'Voté' : 'Voter'}
                </Button>
              ),
              vote.status === 'closed' && (
                <Button
                  size="small"
                  onClick={() => showVoteResults(vote)}
                >
                  Résultats
                </Button>
              )
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={
                <Badge 
                  status={vote.status === 'open' ? 'processing' : 'success'}
                  dot
                >
                  <Avatar icon={<VoteOutlined />} />
                </Badge>
              }
              title={<Text strong>{vote.title}</Text>}
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary">{vote.question}</Text>
                  <Space>
                    <Tag color={getVoteStatusColor(vote.status)}>
                      {getVoteStatusLabel(vote.status)}
                    </Tag>
                    <Text type="secondary">
                      {vote.responses_count}/{vote.eligible_voters_count} votes
                    </Text>
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )

  // Rendu du panel d'ordre du jour
  const renderAgendaPanel = () => (
    <div className="agenda-panel">
      <Timeline>
        {sessionData?.data?.agenda_items?.map((item, index) => (
          <Timeline.Item
            key={item.id}
            color={item.status === 'completed' ? 'green' : item.status === 'current' ? 'blue' : 'gray'}
            dot={item.status === 'current' ? <ClockCircleOutlined className="timeline-clock-icon" /> : null}
          >
            <Space direction="vertical">
              <Text strong>{item.title}</Text>
              <Text type="secondary">{item.description}</Text>
              <Space>
                <Tag color={getAgendaStatusColor(item.status)}>
                  {getAgendaStatusLabel(item.status)}
                </Tag>
                {item.estimated_duration && (
                  <Text type="secondary">{item.estimated_duration} min</Text>
                )}
              </Space>
            </Space>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  )

  // Modal de vote
  const renderVoteModal = () => (
    <Modal
      title={selectedVote?.title}
      open={voteModalVisible}
      onCancel={() => {
        setVoteModalVisible(false)
        setVoteResponse({})
      }}
      footer={[
        <Button key="cancel" onClick={() => setVoteModalVisible(false)}>
          Annuler
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleVoteSubmit}
          loading={castVoteMutation.isLoading}
        >
          Voter
        </Button>
      ]}
    >
      {selectedVote && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>{selectedVote.question}</Paragraph>
          
          {selectedVote.type === 'simple' && (
            <Radio.Group
              value={voteResponse[selectedVote.id]}
              onChange={(e) => setVoteResponse({
                ...voteResponse,
                [selectedVote.id]: e.target.value
              })}
            >
              <Space direction="vertical">
                <Radio value="oui">Oui</Radio>
                <Radio value="non">Non</Radio>
                <Radio value="abstention">Abstention</Radio>
              </Space>
            </Radio.Group>
          )}

          {selectedVote.type === 'multiple_choice' && (
            <Radio.Group
              value={voteResponse[selectedVote.id]}
              onChange={(e) => setVoteResponse({
                ...voteResponse,
                [selectedVote.id]: e.target.value
              })}
            >
              <Space direction="vertical">
                {selectedVote.options?.map((option) => (
                  <Radio key={option.id} value={option.id}>
                    {option.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          )}

          {selectedVote.is_secret && (
            <Alert
              message="Vote secret"
              description="Votre choix restera confidentiel"
              type="info"
              showIcon
            />
          )}
        </Space>
      )}
    </Modal>
  )

  // Fonctions utilitaires
  const getParticipantColor = (role) => {
    const colors = {
      president: '#faad14',
      secretary: '#1890ff',
      member: '#52c41a',
      observer: '#d9d9d9',
      guest: '#722ed1',
    }
    return colors[role] || '#d9d9d9'
  }

  const getParticipantRoleLabel = (role) => {
    const labels = {
      president: 'Président',
      secretary: 'Secrétaire',
      member: 'Membre',
      observer: 'Observateur',
      guest: 'Invité',
    }
    return labels[role] || role
  }

  const getVoteStatusColor = (status) => {
    const colors = {
      open: 'processing',
      closed: 'success',
      cancelled: 'error',
      draft: 'default',
    }
    return colors[status] || 'default'
  }

  const getVoteStatusLabel = (status) => {
    const labels = {
      open: 'En cours',
      closed: 'Terminé',
      cancelled: 'Annulé',
      draft: 'Brouillon',
    }
    return labels[status] || status
  }

  const getAgendaStatusColor = (status) => {
    const colors = {
      pending: 'default',
      current: 'processing',
      completed: 'success',
      postponed: 'warning',
    }
    return colors[status] || 'default'
  }

  const getAgendaStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      current: 'En cours',
      completed: 'Terminé',
      postponed: 'Reporté',
    }
    return labels[status] || status
  }

  const formatMessageTime = (timestamp) => {
    const now = new Date()
    const messageTime = new Date(timestamp)
    const diffMinutes = Math.floor((now - messageTime) / (1000 * 60))
    
    if (diffMinutes < 1) return 'À l\'instant'
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
    
    return messageTime.toLocaleTimeString()
  }

  if (isLoading) {
    return (
      <div className="session-loading">
        <Spin size="large" />
        <Title level={4} style={{ marginTop: '16px' }}>
          Connexion à la session...
        </Title>
      </div>
    )
  }

  return (
    <div className="session-room">
      <Layout>
        {/* En-tête de session */}
        <div className="session-header">
          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical">
                <Title level={3} style={{ margin: 0 }}>
                  {sessionData?.data?.title}
                </Title>
                <Space>
                  <Tag color="blue">{sessionData?.data?.type}</Tag>
                  <Tag color={sessionData?.data?.status === 'live' ? 'red' : 'default'}>
                    <RecordOutlined /> {sessionData?.data?.status === 'live' ? 'EN DIRECT' : sessionData?.data?.status}
                  </Tag>
                  <Text type="secondary">
                    {sessionData?.data?.entity?.name}
                  </Text>
                </Space>
              </Space>
            </Col>
            <Col>
              <Space>
                <Statistic
                  title="Durée"
                  value={sessionData?.data?.duration_minutes || 0}
                  suffix="min"
                  style={{ textAlign: 'center' }}
                />
                <Statistic
                  title="Participants"
                  value={participantsData?.data?.filter(p => p.status === 'present').length || 0}
                  prefix={<TeamOutlined />}
                  style={{ textAlign: 'center' }}
                />
              </Space>
            </Col>
          </Row>
        </div>

        {/* Contenu principal */}
        <div className="session-content">
          <Row gutter={[16, 16]} style={{ height: '100%' }}>
            <Col xs={24} lg={16}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {renderVideoArea()}
                {renderVideoControls()}
              </Space>
            </Col>
            <Col xs={24} lg={8}>
              {renderSidePanel()}
            </Col>
          </Row>
        </div>
      </Layout>

      {/* Modales et tiroirs */}
      {renderVoteModal()}

      <Drawer
        title="Documents de la session"
        placement="right"
        size="large"
        open={documentsDrawerVisible}
        onClose={() => setDocumentsDrawerVisible(false)}
      >
        {/* Contenu des documents */}
        <p>Liste des documents de la session...</p>
      </Drawer>

      <Drawer
        title="Paramètres"
        placement="right"
        open={settingsDrawerVisible}
        onClose={() => setSettingsDrawerVisible(false)}
      >
        {/* Paramètres audio/vidéo */}
        <p>Paramètres de la session...</p>
      </Drawer>
    </div>
  )
}

export default SessionRoom