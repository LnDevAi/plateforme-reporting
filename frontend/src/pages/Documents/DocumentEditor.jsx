import React, { useState, useEffect, useRef } from 'react'
import {
  Layout,
  Card,
  Button,
  Input,
  Select,
  Space,
  Avatar,
  Tag,
  Dropdown,
  Modal,
  Form,
  message,
  Tooltip,
  Badge,
  Timeline,
  Divider,
  Row,
  Col,
  Typography,
  Alert,
  Popover,
  Spin,
  Progress
} from 'antd'
import {
  SaveOutlined,
  LockOutlined,
  UnlockOutlined,
  UserAddOutlined,
  CommentOutlined,
  HistoryOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  EyeOutlined,
  EditOutlined,
  BranchesOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { documentCollaborationAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import './DocumentEditor.css'

const { Sider, Content } = Layout
const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

function DocumentEditor() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // États principaux
  const [documentContent, setDocumentContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)
  const [showComments, setShowComments] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showCollaborators, setShowCollaborators] = useState(false)
  const [selectedText, setSelectedText] = useState(null)
  const [newCommentVisible, setNewCommentVisible] = useState(false)

  // Refs
  const editorRef = useRef()
  const autoSaveTimer = useRef()

  // Modals et formulaires
  const [collaboratorModalVisible, setCollaboratorModalVisible] = useState(false)
  const [approvalModalVisible, setApprovalModalVisible] = useState(false)
  const [form] = Form.useForm()

  // Récupérer la version actuelle du document
  const { data: documentData, isLoading } = useQuery(
    ['document-current', reportId],
    () => documentCollaborationAPI.getCurrentVersion(reportId),
    {
      refetchInterval: 30000, // Actualiser toutes les 30 secondes
      onSuccess: (data) => {
        if (data.data.version.content !== documentContent) {
          setDocumentContent(data.data.version.content)
        }
      }
    }
  )

  // Récupérer l'historique des versions
  const { data: versionsData } = useQuery(
    ['document-versions', reportId],
    () => documentCollaborationAPI.getVersionHistory(reportId)
  )

  // Récupérer les commentaires
  const { data: commentsData } = useQuery(
    ['document-comments', documentData?.data?.version?.id],
    () => documentCollaborationAPI.getComments(documentData.data.version.id),
    {
      enabled: !!documentData?.data?.version?.id
    }
  )

  // Récupérer l'historique des changements
  const { data: changesData } = useQuery(
    ['document-changes', documentData?.data?.version?.id],
    () => documentCollaborationAPI.getChangeHistory(documentData.data.version.id),
    {
      enabled: !!documentData?.data?.version?.id && showHistory
    }
  )

  // Mutations
  const updateContentMutation = useMutation(documentCollaborationAPI.updateContent, {
    onSuccess: () => {
      setLastSaved(new Date())
      queryClient.invalidateQueries(['document-current', reportId])
    },
    onError: (error) => {
      message.error('Erreur lors de la sauvegarde: ' + error.message)
    }
  })

  const lockDocumentMutation = useMutation(documentCollaborationAPI.lockDocument, {
    onSuccess: () => {
      message.success('Document verrouillé')
      queryClient.invalidateQueries(['document-current', reportId])
    },
    onError: (error) => {
      message.error('Erreur de verrouillage: ' + error.message)
    }
  })

  const unlockDocumentMutation = useMutation(documentCollaborationAPI.unlockDocument, {
    onSuccess: () => {
      message.success('Document déverrouillé')
      queryClient.invalidateQueries(['document-current', reportId])
    }
  })

  const addCollaboratorMutation = useMutation(documentCollaborationAPI.addCollaborator, {
    onSuccess: () => {
      message.success('Collaborateur ajouté')
      setCollaboratorModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries(['document-current', reportId])
    }
  })

  const addCommentMutation = useMutation(documentCollaborationAPI.addComment, {
    onSuccess: () => {
      message.success('Commentaire ajouté')
      setNewCommentVisible(false)
      queryClient.invalidateQueries(['document-comments', documentData.data.version.id])
    }
  })

  const submitForApprovalMutation = useMutation(documentCollaborationAPI.submitForApproval, {
    onSuccess: () => {
      message.success('Document soumis pour approbation')
      queryClient.invalidateQueries(['document-current', reportId])
    }
  })

  const approveDocumentMutation = useMutation(documentCollaborationAPI.approveDocument, {
    onSuccess: () => {
      message.success('Document approuvé')
      setApprovalModalVisible(false)
      queryClient.invalidateQueries(['document-current', reportId])
    }
  })

  // Auto-sauvegarde
  useEffect(() => {
    if (autoSaveEnabled && isEditing && documentData?.data?.version?.id) {
      clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        updateContentMutation.mutate({
          versionId: documentData.data.version.id,
          content: documentContent,
          auto_save: true
        })
      }, 2000)
    }

    return () => clearTimeout(autoSaveTimer.current)
  }, [documentContent, autoSaveEnabled, isEditing])

  // Gestion de l'édition
  const handleContentChange = (content) => {
    setDocumentContent(content)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (documentData?.data?.version?.id) {
      updateContentMutation.mutate({
        versionId: documentData.data.version.id,
        content: documentContent,
        auto_save: false
      })
      setIsEditing(false)
    }
  }

  const handleLockToggle = () => {
    if (documentData?.data?.is_locked) {
      unlockDocumentMutation.mutate(documentData.data.version.id)
    } else {
      lockDocumentMutation.mutate({
        versionId: documentData.data.version.id,
        duration: 30
      })
    }
  }

  const handleAddCollaborator = (values) => {
    addCollaboratorMutation.mutate({
      versionId: documentData.data.version.id,
      ...values
    })
  }

  const handleAddComment = (values) => {
    addCommentMutation.mutate({
      versionId: documentData.data.version.id,
      content: values.content,
      comment_type: values.comment_type || 'general',
      priority: values.priority || 'normal',
      selection_start: selectedText?.start,
      selection_end: selectedText?.end,
      selection_text: selectedText?.text
    })
  }

  const handleSubmitForApproval = () => {
    Modal.confirm({
      title: 'Soumettre pour approbation',
      content: 'Êtes-vous sûr de vouloir soumettre ce document pour approbation ?',
      okText: 'Soumettre',
      cancelText: 'Annuler',
      onOk: () => {
        submitForApprovalMutation.mutate(documentData.data.version.id)
      }
    })
  }

  const handleApprove = (values) => {
    approveDocumentMutation.mutate({
      versionId: documentData.data.version.id,
      comment: values.comment
    })
  }

  // Configuration de l'éditeur
  const editorModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
  }

  // Rendu du statut du document
  const renderDocumentStatus = () => {
    const version = documentData?.data?.version
    if (!version) return null

    const statusConfig = {
      draft: { color: 'blue', text: 'Brouillon' },
      pending_approval: { color: 'orange', text: 'En attente d\'approbation' },
      approved: { color: 'green', text: 'Approuvé' },
      rejected: { color: 'red', text: 'Rejeté' }
    }

    const config = statusConfig[version.status] || { color: 'default', text: version.status }

    return (
      <Space>
        <Tag color={config.color}>{config.text}</Tag>
        {version.version_number && (
          <Tag icon={<BranchesOutlined />}>v{version.version_number}</Tag>
        )}
        {documentData.data.is_locked && (
          <Tag color="red" icon={<LockOutlined />}>
            Verrouillé par {documentData.data.lock_user?.name}
          </Tag>
        )}
      </Space>
    )
  }

  // Rendu de la barre d'outils
  const renderToolbar = () => (
    <Space wrap>
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={handleSave}
        loading={updateContentMutation.isLoading}
        disabled={!isEditing || !documentData?.data?.can_edit}
      >
        Sauvegarder
      </Button>

      <Button
        icon={documentData?.data?.is_locked ? <UnlockOutlined /> : <LockOutlined />}
        onClick={handleLockToggle}
        loading={lockDocumentMutation.isLoading || unlockDocumentMutation.isLoading}
        disabled={!documentData?.data?.can_edit}
      >
        {documentData?.data?.is_locked ? 'Déverrouiller' : 'Verrouiller'}
      </Button>

      <Button
        icon={<UserAddOutlined />}
        onClick={() => setCollaboratorModalVisible(true)}
        disabled={!documentData?.data?.can_edit}
      >
        Ajouter Collaborateur
      </Button>

      <Button
        icon={<CommentOutlined />}
        onClick={() => setShowComments(!showComments)}
        type={showComments ? 'primary' : 'default'}
      >
        Commentaires ({commentsData?.data?.length || 0})
      </Button>

      <Button
        icon={<HistoryOutlined />}
        onClick={() => setShowHistory(!showHistory)}
        type={showHistory ? 'primary' : 'default'}
      >
        Historique
      </Button>

      {documentData?.data?.version?.status === 'draft' && documentData?.data?.can_edit && (
        <Button
          icon={<SendOutlined />}
          onClick={handleSubmitForApproval}
          loading={submitForApprovalMutation.isLoading}
        >
          Soumettre pour approbation
        </Button>
      )}

      {documentData?.data?.version?.status === 'pending_approval' && user?.role === 'admin' && (
        <Button
          icon={<CheckOutlined />}
          type="primary"
          onClick={() => setApprovalModalVisible(true)}
        >
          Approuver
        </Button>
      )}
    </Space>
  )

  // Rendu des collaborateurs
  const renderCollaborators = () => (
    <Card title="Collaborateurs" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        {documentData?.data?.version?.collaborators?.map((collaborator) => (
          <div key={collaborator.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Avatar size="small">{collaborator.name.charAt(0)}</Avatar>
              <div>
                <Text strong>{collaborator.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {collaborator.pivot.permission_level}
                </Text>
              </div>
            </Space>
            <Tag color="blue">{collaborator.pivot.permission_level}</Tag>
          </div>
        ))}
      </Space>
    </Card>
  )

  // Rendu des commentaires
  const renderComments = () => (
    <Card 
      title="Commentaires" 
      size="small"
      extra={
        <Button 
          size="small" 
          icon={<CommentOutlined />}
          onClick={() => setNewCommentVisible(true)}
        >
          Nouveau
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {commentsData?.data?.map((comment) => (
          <Card key={comment.id} size="small" style={{ marginBottom: '8px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Space>
                  <Avatar size="small">{comment.user.name.charAt(0)}</Avatar>
                  <Text strong>{comment.user.name}</Text>
                  <Tag color="blue">{comment.comment_type}</Tag>
                  {comment.priority === 'high' && <Tag color="red">Haute</Tag>}
                </Space>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {new Date(comment.created_at).toLocaleString()}
                </Text>
              </div>
              
              <Paragraph>{comment.content}</Paragraph>
              
              {comment.selection_text && (
                <Alert
                  message="Texte sélectionné"
                  description={comment.selection_text}
                  type="info"
                  showIcon
                  style={{ fontSize: '12px' }}
                />
              )}
              
              {!comment.is_resolved && (
                <Button 
                  size="small" 
                  type="link"
                  onClick={() => {
                    // Mutation pour résoudre le commentaire
                  }}
                >
                  Marquer comme résolu
                </Button>
              )}
            </Space>
          </Card>
        ))}
      </Space>
    </Card>
  )

  // Rendu de l'historique
  const renderHistory = () => (
    <Card title="Historique des changements" size="small">
      <Timeline>
        {changesData?.data?.map((change) => (
          <Timeline.Item
            key={change.id}
            color={change.change_color}
            dot={<Avatar size="small">{change.user.name.charAt(0)}</Avatar>}
          >
            <Space direction="vertical">
              <Text strong>{change.formatted_description}</Text>
              <Text type="secondary">{change.user.name}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {new Date(change.created_at).toLocaleString()}
              </Text>
            </Space>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  )

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Chargement du document...</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="document-editor">
      <Layout style={{ minHeight: '100vh' }}>
        {/* Barre d'outils principale */}
        <div className="editor-toolbar" style={{ 
          padding: '16px', 
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff'
        }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical">
                <Title level={4} style={{ margin: 0 }}>
                  {documentData?.data?.version?.title || 'Document sans titre'}
                </Title>
                {renderDocumentStatus()}
              </Space>
            </Col>
            <Col>
              {renderToolbar()}
            </Col>
          </Row>
          
          {/* Indicateurs de statut */}
          <Row style={{ marginTop: '8px' }}>
            <Col span={24}>
              <Space>
                {autoSaveEnabled && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <ClockCircleOutlined /> Sauvegarde automatique activée
                  </Text>
                )}
                {lastSaved && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Dernière sauvegarde: {lastSaved.toLocaleTimeString()}
                  </Text>
                )}
                {isEditing && (
                  <Text type="warning" style={{ fontSize: '12px' }}>
                    <WarningOutlined /> Modifications non sauvegardées
                  </Text>
                )}
              </Space>
            </Col>
          </Row>
        </div>

        <Layout>
          {/* Contenu principal - Éditeur */}
          <Content style={{ padding: '24px' }}>
            <Card style={{ minHeight: '600px' }}>
              <ReactQuill
                ref={editorRef}
                theme="snow"
                value={documentContent}
                onChange={handleContentChange}
                modules={editorModules}
                readOnly={!documentData?.data?.can_edit || documentData?.data?.is_locked}
                style={{ minHeight: '500px' }}
              />
            </Card>
          </Content>

          {/* Panneau latéral - Commentaires et Collaborateurs */}
          {(showComments || showHistory) && (
            <Sider width={350} style={{ backgroundColor: '#f5f5f5', padding: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {renderCollaborators()}
                {showComments && renderComments()}
                {showHistory && renderHistory()}
              </Space>
            </Sider>
          )}
        </Layout>
      </Layout>

      {/* Modal d'ajout de collaborateur */}
      <Modal
        title="Ajouter un collaborateur"
        open={collaboratorModalVisible}
        onCancel={() => setCollaboratorModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddCollaborator} layout="vertical">
          <Form.Item
            name="user_id"
            label="Utilisateur"
            rules={[{ required: true, message: 'Sélectionnez un utilisateur' }]}
          >
            <Select
              showSearch
              placeholder="Rechercher un utilisateur..."
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {/* Ici, vous chargeriez la liste des utilisateurs disponibles */}
              <Option value="1">Jean Dupont</Option>
              <Option value="2">Marie Martin</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="permission_level"
            label="Niveau de permission"
            rules={[{ required: true, message: 'Sélectionnez un niveau' }]}
          >
            <Select>
              <Option value="view">Lecture seule</Option>
              <Option value="comment">Commenter</Option>
              <Option value="edit">Éditer</Option>
              <Option value="admin">Administrateur</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={addCollaboratorMutation.isLoading}>
                Ajouter
              </Button>
              <Button onClick={() => setCollaboratorModalVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de nouveau commentaire */}
      <Modal
        title="Nouveau commentaire"
        open={newCommentVisible}
        onCancel={() => setNewCommentVisible(false)}
        footer={null}
      >
        <Form onFinish={handleAddComment} layout="vertical">
          <Form.Item
            name="content"
            label="Commentaire"
            rules={[{ required: true, message: 'Saisissez votre commentaire' }]}
          >
            <TextArea rows={4} placeholder="Votre commentaire..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="comment_type" label="Type">
                <Select defaultValue="general">
                  <Option value="general">Général</Option>
                  <Option value="suggestion">Suggestion</Option>
                  <Option value="correction">Correction</Option>
                  <Option value="question">Question</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priorité">
                <Select defaultValue="normal">
                  <Option value="low">Basse</Option>
                  <Option value="normal">Normale</Option>
                  <Option value="high">Haute</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={addCommentMutation.isLoading}>
                Ajouter commentaire
              </Button>
              <Button onClick={() => setNewCommentVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal d'approbation */}
      <Modal
        title="Approuver le document"
        open={approvalModalVisible}
        onCancel={() => setApprovalModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleApprove} layout="vertical">
          <Form.Item
            name="comment"
            label="Commentaire d'approbation (optionnel)"
          >
            <TextArea rows={3} placeholder="Commentaire sur l'approbation..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={approveDocumentMutation.isLoading}>
                Approuver
              </Button>
              <Button onClick={() => setApprovalModalVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DocumentEditor