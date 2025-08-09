import React, { useState, useEffect } from 'react'
import { 
  Steps, 
  Card, 
  Form, 
  Select, 
  Input, 
  DatePicker, 
  Button, 
  Typography, 
  Space, 
  Alert, 
  Divider,
  Tag,
  Row,
  Col,
  message,
  Modal
} from 'antd'
import { 
  FileTextOutlined, 
  SettingOutlined, 
  PlayCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { reportsAPI, metaAPI } from '../../services/api'
import dayjs from 'dayjs'

const { Step } = Steps
const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker

function EpeReportWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  // État du formulaire
  const [reportData, setReportData] = useState({
    category: '',
    type: '',
    name: '',
    description: '',
    parameters: {},
    exercice: new Date().getFullYear(),
    entite_epe: '',
    is_regulatory: false,
  })

  // Catégories EPE spécifiques
  const epeCategories = [
    {
      value: 'sessions_budgetaires',
      label: 'Sessions Budgétaires',
      description: 'Documents examinés lors des sessions budgétaires des conseils d\'administration',
      icon: '📊',
      types: [
        'Projet de Budget Annuel',
        'Plan de Passation des Marchés',
        'Nomenclature Budgétaire UEMOA',
        'Programme d\'Activités'
      ]
    },
    {
      value: 'arret_comptes',
      label: 'Arrêt des Comptes',
      description: 'Analyse des rapports de gestion et états financiers pour l\'exercice écoulé',
      icon: '📋',
      types: [
        'États Financiers Annuels',
        'Rapport d\'Activités Détaillé',
        'Compte de Gestion Agent Comptable',
        'Inventaire Physique et Patrimoine'
      ]
    },
    {
      value: 'assemblees_generales',
      label: 'Assemblées Générales',
      description: 'Documents examinés lors des assemblées générales des EPE',
      icon: '🏛️',
      types: [
        'Rapport de Gestion CA (EPE)',
        'États Financiers Certifiés',
        'Bilan Social et RH',
        'Comptes Sociaux (Sociétés d\'État)'
      ]
    },
    {
      value: 'comptabilite_matieres',
      label: 'Comptabilité des Matières',
      description: 'Documents post-réforme UEMOA pour la traçabilité des biens publics',
      icon: '📦',
      types: [
        'Livre-Journal des Matières',
        'Grand Livre par Nature de Matières',
        'États d\'Inventaire Périodiques',
        'Rapport Comptable des Matières',
        'États de Réforme et Mise au Rebut'
      ]
    }
  ]

  // Entités EPE types
  const entitesEpe = [
    { value: 'SONABEL', label: 'SONABEL - Société Nationale d\'Électricité' },
    { value: 'ONEA', label: 'ONEA - Office National de l\'Eau et de l\'Assainissement' },
    { value: 'SONAPOST', label: 'SONAPOST - Société Nationale des Postes' },
    { value: 'AIR_BURKINA', label: 'Air Burkina - Compagnie Aérienne' },
    { value: 'SITARAIL', label: 'SITARAIL - Société de Transport Ferroviaire' },
    { value: 'BARC', label: 'BARC - Banque Agricole et de Développement Rural' },
    { value: 'LONAB', label: 'LONAB - Loterie Nationale du Burkina' },
    { value: 'SONATERA', label: 'SONATERA - Société Nationale de Télécommunications' },
  ]

  // Exercices disponibles
  const exercicesDisponibles = []
  for (let year = 2020; year <= new Date().getFullYear() + 1; year++) {
    exercicesDisponibles.push({ value: year, label: `Exercice ${year}` })
  }

  // Mutation pour créer le rapport
  const createReportMutation = useMutation(reportsAPI.create, {
    onSuccess: (data) => {
      message.success('Rapport EPE créé avec succès !')
      navigate(`/reports/${data.data.id}`)
    },
    onError: (error) => {
      message.error('Erreur lors de la création: ' + error.message)
    },
  })

  // Étape 1: Sélection de la catégorie
  const renderCategoryStep = () => (
    <div>
      <Title level={3}>
        <FileTextOutlined /> Sélection du Type de Rapport EPE
      </Title>
      <Paragraph>
        Choisissez la catégorie correspondant au type de session ou document à générer 
        selon le cadre réglementaire UEMOA et les obligations des EPE.
      </Paragraph>

      <Row gutter={[16, 16]}>
        {epeCategories.map((category) => (
          <Col xs={24} sm={12} lg={12} key={category.value}>
            <Card
              hoverable
              className={reportData.category === category.value ? 'selected-card' : ''}
              onClick={() => {
                setReportData(prev => ({ ...prev, category: category.value, type: '' }))
                form.setFieldsValue({ category: category.value })
              }}
              style={{
                border: reportData.category === category.value ? '2px solid #1890ff' : '1px solid #d9d9d9',
                cursor: 'pointer'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {category.icon}
                </div>
                <Title level={4} style={{ margin: 0 }}>
                  {category.label}
                </Title>
              </div>
              
              <Paragraph style={{ textAlign: 'center', color: '#666' }}>
                {category.description}
              </Paragraph>

              <Divider />
              
              <div>
                <Text strong>Types de rapports :</Text>
                <ul style={{ marginTop: '8px', paddingLeft: '16px' }}>
                  {category.types.map((type, index) => (
                    <li key={index} style={{ fontSize: '12px', color: '#666' }}>
                      {type}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {reportData.category && (
        <Alert
          message="Catégorie sélectionnée"
          description={`Vous avez sélectionné: ${epeCategories.find(c => c.value === reportData.category)?.label}`}
          type="success"
          showIcon
          style={{ marginTop: '24px' }}
        />
      )}
    </div>
  )

  // Étape 2: Configuration du rapport
  const renderConfigurationStep = () => (
    <div>
      <Title level={3}>
        <SettingOutlined /> Configuration du Rapport
      </Title>

      <Form
        form={form}
        layout="vertical"
        initialValues={reportData}
        onValuesChange={(changedValues, allValues) => {
          setReportData(prev => ({ ...prev, ...allValues }))
        }}
      >
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="type"
              label="Type de rapport spécifique"
              rules={[{ required: true, message: 'Veuillez sélectionner un type de rapport' }]}
            >
              <Select
                placeholder="Sélectionner le type de rapport"
                size="large"
              >
                {reportData.category && epeCategories
                  .find(c => c.value === reportData.category)?.types
                  .map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="entite_epe"
              label="Entité EPE"
              rules={[{ required: true, message: 'Veuillez sélectionner une entité EPE' }]}
            >
              <Select
                placeholder="Sélectionner l'entité EPE"
                size="large"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {entitesEpe.map((entite) => (
                  <Option key={entite.value} value={entite.value}>
                    {entite.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="exercice"
              label="Exercice budgétaire"
              rules={[{ required: true, message: 'Veuillez sélectionner un exercice' }]}
            >
              <Select
                placeholder="Sélectionner l'exercice"
                size="large"
              >
                {exercicesDisponibles.map((exercice) => (
                  <Option key={exercice.value} value={exercice.value}>
                    {exercice.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="format_export"
              label="Format d'export"
              initialValue="excel"
            >
              <Select size="large">
                <Option value="excel">Excel (.xlsx)</Option>
                <Option value="pdf">PDF</Option>
                <Option value="json">JSON</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="name"
              label="Nom du rapport"
              rules={[{ required: true, message: 'Veuillez saisir un nom' }]}
            >
              <Input
                size="large"
                placeholder="Ex: Budget Annuel SONABEL 2024"
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea
                rows={3}
                placeholder="Description détaillée du rapport (optionnel)"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Paramètres spécifiques selon le type */}
        {reportData.type && renderSpecificParameters()}
      </Form>
    </div>
  )

  // Paramètres spécifiques selon le type de rapport
  const renderSpecificParameters = () => {
    const specificParams = getSpecificParameters(reportData.type)
    
    if (specificParams.length === 0) return null

    return (
      <Card title="Paramètres spécifiques" style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          {specificParams.map((param) => (
            <Col xs={24} md={12} key={param.name}>
              <Form.Item
                name={param.name}
                label={param.label}
                rules={param.required ? [{ required: true, message: `${param.label} est requis` }] : []}
              >
                {param.type === 'select' ? (
                  <Select placeholder={param.placeholder}>
                    {param.options?.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                ) : param.type === 'date' ? (
                  <DatePicker style={{ width: '100%' }} />
                ) : param.type === 'daterange' ? (
                  <RangePicker style={{ width: '100%' }} />
                ) : (
                  <Input placeholder={param.placeholder} />
                )}
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>
    )
  }

  // Obtenir les paramètres spécifiques
  const getSpecificParameters = (reportType) => {
    const parameterMap = {
      'Plan de Passation des Marchés': [
        {
          name: 'seuil_marche',
          label: 'Seuil minimum (FCFA)',
          type: 'input',
          placeholder: 'Ex: 5000000',
          required: true
        }
      ],
      'Nomenclature Budgétaire UEMOA': [
        {
          name: 'niveau_detail',
          label: 'Niveau de détail',
          type: 'select',
          options: [
            { value: 1, label: 'Niveau 1 - Chapitres' },
            { value: 2, label: 'Niveau 2 - Articles' },
            { value: 3, label: 'Niveau 3 - Paragraphes' },
            { value: 4, label: 'Niveau 4 - Lignes' }
          ],
          required: true
        }
      ],
      'Programme d\'Activités': [
        {
          name: 'secteur_activite',
          label: 'Secteur d\'activité',
          type: 'select',
          options: [
            { value: 'energie', label: 'Énergie' },
            { value: 'eau', label: 'Eau et Assainissement' },
            { value: 'transport', label: 'Transport' },
            { value: 'telecoms', label: 'Télécommunications' },
            { value: 'finance', label: 'Finance' }
          ],
          required: true
        }
      ],
      'Inventaire Physique et Patrimoine': [
        {
          name: 'date_inventaire',
          label: 'Date d\'inventaire',
          type: 'date',
          required: true
        }
      ],
      'Livre-Journal des Matières': [
        {
          name: 'periode',
          label: 'Période',
          type: 'daterange',
          required: true
        }
      ],
      'Grand Livre par Nature de Matières': [
        {
          name: 'nature_matiere',
          label: 'Nature de matière',
          type: 'select',
          options: [
            { value: 'fournitures_bureau', label: 'Fournitures de bureau' },
            { value: 'materiels_informatique', label: 'Matériels informatiques' },
            { value: 'vehicules', label: 'Véhicules' },
            { value: 'mobilier', label: 'Mobilier' },
            { value: 'equipements_techniques', label: 'Équipements techniques' }
          ],
          required: true
        }
      ]
    }

    return parameterMap[reportType] || []
  }

  // Étape 3: Validation et génération
  const renderValidationStep = () => (
    <div>
      <Title level={3}>
        <CheckCircleOutlined /> Validation et Génération
      </Title>

      <Alert
        message="Conformité UEMOA"
        description="Ce rapport respecte les directives UEMOA et les obligations réglementaires des EPE du Burkina Faso."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <Card title="Récapitulatif du rapport">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text><strong>Catégorie:</strong> {epeCategories.find(c => c.value === reportData.category)?.label}</Text>
              <Text><strong>Type:</strong> {reportData.type}</Text>
              <Text><strong>Entité EPE:</strong> {entitesEpe.find(e => e.value === reportData.entite_epe)?.label}</Text>
              <Text><strong>Exercice:</strong> {reportData.exercice}</Text>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text><strong>Nom:</strong> {reportData.name}</Text>
              <Text><strong>Format:</strong> {reportData.format_export?.toUpperCase()}</Text>
              <Text><strong>Réglementaire:</strong> 
                <Tag color={reportData.is_regulatory ? 'red' : 'blue'} style={{ marginLeft: '8px' }}>
                  {reportData.is_regulatory ? 'Obligatoire' : 'Facultatif'}
                </Tag>
              </Text>
            </Space>
          </Col>
        </Row>

        {reportData.description && (
          <>
            <Divider />
            <Text><strong>Description:</strong></Text>
            <Paragraph style={{ marginTop: '8px' }}>
              {reportData.description}
            </Paragraph>
          </>
        )}
      </Card>

      <Card title="Actions disponibles" style={{ marginTop: '16px' }}>
        <Space size="large">
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            loading={createReportMutation.isLoading}
            onClick={handleCreateAndExecute}
          >
            Créer et Exécuter
          </Button>
          <Button
            size="large"
            onClick={handleCreateOnly}
            loading={createReportMutation.isLoading}
          >
            Créer Seulement
          </Button>
        </Space>
      </Card>
    </div>
  )

  // Actions de création
  const handleCreateAndExecute = async () => {
    try {
      const reportPayload = buildReportPayload()
      const response = await createReportMutation.mutateAsync(reportPayload)
      
      // Exécuter immédiatement après création
      message.success('Rapport créé ! Exécution en cours...')
      navigate(`/reports/${response.data.id}/execute`)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleCreateOnly = async () => {
    try {
      const reportPayload = buildReportPayload()
      await createReportMutation.mutateAsync(reportPayload)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Construire le payload du rapport
  const buildReportPayload = () => {
    const categoryData = epeCategories.find(c => c.value === reportData.category)
    
    return {
      name: reportData.name,
      description: reportData.description || `Rapport ${reportData.type} pour ${reportData.entite_epe} - Exercice ${reportData.exercice}`,
      type: 'table',
      category: reportData.category,
      query: getTemplateQuery(reportData.type),
      parameters: {
        exercice: reportData.exercice,
        entite_epe: reportData.entite_epe,
        ...form.getFieldsValue()
      },
      visualization_config: {
        chart_type: 'table',
        title: reportData.name,
        subtitle: `${categoryData?.label} - ${reportData.type}`
      },
      is_active: true
    }
  }

  // Obtenir le template SQL selon le type
  const getTemplateQuery = (reportType) => {
    // Ici, en production, vous récupéreriez les templates depuis la base de données
    // Pour la démo, on retourne une requête simple
    return `-- ${reportType}
SELECT 
  'Exemple' as colonne1,
  '${reportData.exercice}' as exercice,
  '${reportData.entite_epe}' as entite_epe,
  NOW() as date_generation
-- Ce template sera remplacé par la requête réelle depuis la base de données`
  }

  // Navigation entre les étapes
  const nextStep = () => {
    if (currentStep === 0 && !reportData.category) {
      message.warning('Veuillez sélectionner une catégorie')
      return
    }
    
    if (currentStep === 1) {
      form.validateFields().then(() => {
        setCurrentStep(currentStep + 1)
      }).catch(() => {
        message.warning('Veuillez remplir tous les champs requis')
      })
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  return (
    <div className="fade-in">
      <Title level={2}>Assistant de Création de Rapports EPE</Title>
      <Paragraph>
        Créez vos rapports conformes au cadre réglementaire UEMOA et aux obligations 
        des Entreprises Publiques d'État du Burkina Faso.
      </Paragraph>

      <Card>
        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          <Step title="Type de Rapport" description="Sélection de la catégorie" />
          <Step title="Configuration" description="Paramètres et options" />
          <Step title="Validation" description="Vérification et génération" />
        </Steps>

        <div style={{ minHeight: '400px' }}>
          {currentStep === 0 && renderCategoryStep()}
          {currentStep === 1 && renderConfigurationStep()}
          {currentStep === 2 && renderValidationStep()}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Space size="large">
            {currentStep > 0 && (
              <Button size="large" onClick={prevStep}>
                Précédent
              </Button>
            )}
            {currentStep < 2 && (
              <Button
                type="primary"
                size="large"
                onClick={nextStep}
                disabled={currentStep === 0 && !reportData.category}
              >
                Suivant
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default EpeReportWizard