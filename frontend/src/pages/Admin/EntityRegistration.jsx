import React, { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Steps,
  Row,
  Col,
  Typography,
  Space,
  Alert,
  Divider,
  DatePicker,
  InputNumber,
  Upload,
  message,
  Tooltip,
  Tag,
  Collapse,
  List,
} from 'antd'
import {
  BankOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery } from 'react-query'
import { entityAPI, ministryAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select
const { Step } = Steps
const { Panel } = Collapse

// Types de structures
const STRUCTURE_TYPES = {
  'societe_etat': {
    label: 'Société d\'État',
    description: 'Entreprise commerciale dont l\'État détient le capital',
    icon: '🏛️',
    color: 'blue',
    requirements: [
      'Capital social détenu par l\'État',
      'Conseil d\'Administration obligatoire',
      'Assemblée Générale annuelle',
      'Commissaires aux comptes',
      'États financiers SYSCOHADA'
    ]
  },
  'etablissement_public': {
    label: 'Établissement Public',
    description: 'Organisme public doté de la personnalité morale',
    icon: '🏢',
    color: 'green',
    requirements: [
      'Personnalité morale de droit public',
      'Autonomie financière',
      'Agent comptable public',
      'Contrôle de l\'État',
      'Comptabilité des matières'
    ]
  },
  'autres': {
    label: 'Autres',
    description: 'Autres entités publiques ou parapubliques',
    icon: '📋',
    color: 'orange',
    requirements: [
      'Statut particulier',
      'Mission d\'intérêt général',
      'Supervision publique',
      'Reporting spécialisé'
    ]
  }
}

// Secteurs d'activité
const SECTORS = [
  'Énergie',
  'Eau et Assainissement',
  'Transport',
  'Télécommunications',
  'Services Postaux',
  'Agriculture',
  'Mines',
  'Industrie',
  'Commerce',
  'Banque et Finance',
  'Immobilier',
  'Santé',
  'Éducation',
  'Culture',
  'Sport',
  'Autre'
]

function EntityRegistration() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedType, setSelectedType] = useState(null)
  const [formData, setFormData] = useState({})

  // Récupérer la liste des ministères
  const { data: ministriesData } = useQuery('ministries', ministryAPI.getMinistries)

  // Mutation pour créer l'entité
  const createEntityMutation = useMutation(entityAPI.createEntity, {
    onSuccess: (data) => {
      message.success('Structure enregistrée avec succès !')
      navigate('/admin/entities')
    },
    onError: (error) => {
      message.error('Erreur lors de l\'enregistrement de la structure')
      console.error(error)
    }
  })

  const steps = [
    {
      title: 'Type de Structure',
      description: 'Choix du type',
      icon: <BankOutlined />
    },
    {
      title: 'Informations Générales',
      description: 'Données de base',
      icon: <InfoCircleOutlined />
    },
    {
      title: 'Direction et Gouvernance',
      description: 'Dirigeants et organes',
      icon: <UserOutlined />
    },
    {
      title: 'Supervision Ministérielle',
      description: 'Tutelles et contrôle',
      icon: <BankOutlined />
    },
    {
      title: 'Confirmation',
      description: 'Validation finale',
      icon: <CheckCircleOutlined />
    }
  ]

  const handleNext = async () => {
    try {
      const values = await form.validateFields()
      setFormData(prev => ({ ...prev, ...values }))
      setCurrentStep(prev => prev + 1)
    } catch (error) {
      console.error('Validation échouée:', error)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const finalData = { ...formData, ...values }
      
      createEntityMutation.mutate(finalData)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    }
  }

  const handleTypeSelect = (type) => {
    setSelectedType(type)
    setFormData(prev => ({ ...prev, type }))
    form.setFieldsValue({ type })
  }

  // Étape 1: Sélection du type de structure
  const renderTypeSelection = () => (
    <div className="type-selection">
      <Title level={3} style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <BankOutlined style={{ marginRight: '8px' }} />
        Quel type de structure souhaitez-vous enregistrer ?
      </Title>
      
      <Row gutter={[24, 24]}>
        {Object.entries(STRUCTURE_TYPES).map(([key, type]) => (
          <Col xs={24} md={8} key={key}>
            <Card
              hoverable
              className={`type-card ${selectedType === key ? 'selected' : ''}`}
              onClick={() => handleTypeSelect(key)}
              style={{
                border: selectedType === key ? '2px solid #1890ff' : '1px solid #d9d9d9',
                height: '100%'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  {type.icon}
                </div>
                <Title level={4} style={{ margin: 0 }}>
                  {type.label}
                </Title>
                <Text type="secondary">{type.description}</Text>
              </div>
              
              <Divider />
              
              <div>
                <Text strong>Exigences principales :</Text>
                <List
                  size="small"
                  dataSource={type.requirements}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '4px 0' }}>
                      <Text style={{ fontSize: '12px' }}>• {item}</Text>
                    </List.Item>
                  )}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {selectedType && (
        <Alert
          style={{ marginTop: '2rem' }}
          message={`Type sélectionné : ${STRUCTURE_TYPES[selectedType].label}`}
          description={`Vous allez enregistrer une ${STRUCTURE_TYPES[selectedType].label.toLowerCase()}. Les exigences réglementaires correspondantes seront automatiquement appliquées.`}
          type="info"
          showIcon
        />
      )}
    </div>
  )

  // Étape 2: Informations générales
  const renderGeneralInfo = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24}>
        <Card title="Informations de Base">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Dénomination sociale"
                rules={[{ required: true, message: 'Veuillez saisir la dénomination' }]}
              >
                <Input 
                  placeholder="Ex: Société Nationale d'Électricité du Burkina"
                  prefix={<BankOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="code"
                label="Code/Sigle"
                rules={[{ required: true, message: 'Veuillez saisir le code' }]}
              >
                <Input 
                  placeholder="Ex: SONABEL"
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="description"
                label="Description de l'activité"
                rules={[{ required: true, message: 'Veuillez décrire l\'activité' }]}
              >
                <TextArea 
                  rows={3}
                  placeholder="Décrivez la mission et les activités principales..."
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="sector"
                label="Secteur d'activité"
                rules={[{ required: true, message: 'Veuillez sélectionner le secteur' }]}
              >
                <Select placeholder="Sélectionnez un secteur">
                  {SECTORS.map(sector => (
                    <Option key={sector} value={sector}>{sector}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="establishment_date"
                label="Date de création"
                rules={[{ required: true, message: 'Veuillez saisir la date de création' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="Date de création"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Informations de Contact">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                name="headquarters_address"
                label="Adresse du siège social"
                rules={[{ required: true, message: 'Veuillez saisir l\'adresse' }]}
              >
                <TextArea 
                  rows={2}
                  placeholder="Adresse complète du siège social"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="contact_email"
                label="Email"
                rules={[
                  { required: true, message: 'Veuillez saisir l\'email' },
                  { type: 'email', message: 'Format email invalide' }
                ]}
              >
                <Input 
                  placeholder="contact@entite.bf"
                  prefix={<MailOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="contact_phone"
                label="Téléphone"
                rules={[{ required: true, message: 'Veuillez saisir le téléphone' }]}
              >
                <Input 
                  placeholder="+226 XX XX XX XX"
                  prefix={<PhoneOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="website"
                label="Site web"
              >
                <Input 
                  placeholder="https://www.entite.bf"
                  prefix={<GlobalOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      {selectedType === 'societe_etat' && (
        <Col xs={24}>
          <Card title="Informations Financières">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="capital_amount"
                  label="Capital social (FCFA)"
                  rules={[{ required: true, message: 'Veuillez saisir le capital' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Montant du capital"
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                    prefix={<DollarOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="employee_count"
                  label="Nombre d'employés"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Effectif total"
                    min={0}
                    prefix={<TeamOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="annual_revenue"
                  label="Chiffre d'affaires annuel (FCFA)"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="CA de l'exercice précédent"
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>
      )}
    </Row>
  )

  // Étape 3: Direction et gouvernance
  const renderGovernance = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24}>
        <Card title="Direction et Gouvernance">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="director_general"
                label="Directeur Général"
                rules={[{ required: true, message: 'Veuillez saisir le nom du DG' }]}
              >
                <Input 
                  placeholder="Nom et prénom du Directeur Général"
                  prefix={<UserOutlined />}
                />
              </Form.Item>
            </Col>
            
            {(selectedType === 'societe_etat' || selectedType === 'etablissement_public') && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="board_president"
                  label="Président du Conseil d'Administration"
                  rules={[{ required: true, message: 'Veuillez saisir le nom du PCA' }]}
                >
                  <Input 
                    placeholder="Nom et prénom du PCA"
                    prefix={<UserOutlined />}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Exigences Spécifiques">
          <Collapse>
            {Object.entries(STRUCTURE_TYPES[selectedType]?.requirements || {}).map(([category, requirements]) => (
              <Panel header={category.charAt(0).toUpperCase() + category.slice(1)} key={category}>
                <List
                  dataSource={requirements}
                  renderItem={(item) => (
                    <List.Item>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      {item}
                    </List.Item>
                  )}
                />
              </Panel>
            ))}
          </Collapse>
        </Card>
      </Col>
    </Row>
  )

  // Étape 4: Supervision ministérielle
  const renderSupervision = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24}>
        <Card title="Tutelles Ministérielles">
          <Alert
            message="Information importante"
            description="Chaque entité publique doit avoir au minimum une tutelle technique. La tutelle financière peut être différente ou identique."
            type="info"
            style={{ marginBottom: '1rem' }}
          />
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="technical_ministry_id"
                label="Ministère de tutelle technique"
                rules={[{ required: true, message: 'Veuillez sélectionner la tutelle technique' }]}
              >
                <Select 
                  placeholder="Sélectionnez le ministère de tutelle technique"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {ministriesData?.data?.map(ministry => (
                    <Option key={ministry.id} value={ministry.id}>
                      {ministry.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="financial_ministry_id"
                label="Ministère de tutelle financière"
                rules={[{ required: true, message: 'Veuillez sélectionner la tutelle financière' }]}
              >
                <Select 
                  placeholder="Sélectionnez le ministère de tutelle financière"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {ministriesData?.data?.map(ministry => (
                    <Option key={ministry.id} value={ministry.id}>
                      {ministry.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  )

  // Étape 5: Confirmation
  const renderConfirmation = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24}>
        <Card title="Récapitulatif de l'enregistrement">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card size="small" title="Type de Structure">
                <Tag 
                  color={STRUCTURE_TYPES[formData.type]?.color}
                  style={{ fontSize: '14px', padding: '4px 8px' }}
                >
                  {STRUCTURE_TYPES[formData.type]?.icon} {STRUCTURE_TYPES[formData.type]?.label}
                </Tag>
                <Paragraph style={{ marginTop: '8px', fontSize: '12px' }}>
                  {STRUCTURE_TYPES[formData.type]?.description}
                </Paragraph>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card size="small" title="Informations Générales">
                <Space direction="vertical" size="small">
                  <Text><strong>Nom :</strong> {formData.name}</Text>
                  <Text><strong>Code :</strong> {formData.code}</Text>
                  <Text><strong>Secteur :</strong> {formData.sector}</Text>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card size="small" title="Gouvernance">
                <Space direction="vertical" size="small">
                  <Text><strong>DG :</strong> {formData.director_general}</Text>
                  {formData.board_president && (
                    <Text><strong>PCA :</strong> {formData.board_president}</Text>
                  )}
                </Space>
              </Card>
            </Col>
          </Row>

          <Alert
            style={{ marginTop: '1rem' }}
            message="Prêt pour l'enregistrement"
            description="Vérifiez les informations ci-dessus avant de finaliser l'enregistrement. Une fois créée, la structure sera ajoutée au système de reporting."
            type="success"
            showIcon
          />
        </Card>
      </Col>
    </Row>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderTypeSelection()
      case 1:
        return renderGeneralInfo()
      case 2:
        return renderGovernance()
      case 3:
        return renderSupervision()
      case 4:
        return renderConfirmation()
      default:
        return null
    }
  }

  return (
    <div className="entity-registration">
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <BankOutlined style={{ marginRight: '12px' }} />
          Enregistrement d'une Structure Publique
        </Title>

        <Steps current={currentStep} style={{ marginBottom: '2rem' }}>
          {steps.map((step, index) => (
            <Step 
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          initialValues={formData}
        >
          {renderStepContent()}
        </Form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrevious}>
                Précédent
              </Button>
            )}
            
            {currentStep < steps.length - 1 && (
              <Button 
                type="primary" 
                onClick={handleNext}
                disabled={currentStep === 0 && !selectedType}
              >
                Suivant
              </Button>
            )}
            
            {currentStep === steps.length - 1 && (
              <Button 
                type="primary" 
                onClick={handleSubmit}
                loading={createEntityMutation.isLoading}
              >
                Enregistrer la Structure
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default EntityRegistration