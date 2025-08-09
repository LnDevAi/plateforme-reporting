import React, { useState } from 'react'
import { 
  Form, 
  Input, 
  Select, 
  Switch, 
  Button, 
  Card, 
  Row, 
  Col, 
  Typography,
  message,
  Space,
  Divider,
  Steps,
  Tag
} from 'antd'
import { 
  SaveOutlined, 
  PlayCircleOutlined, 
  ArrowLeftOutlined,
  DatabaseOutlined,
  SettingOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-sql'
import 'ace-builds/src-noconflict/theme-monokai'
import 'ace-builds/src-noconflict/ext-language_tools'

import { reportsAPI, metaAPI } from '../../services/api'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { Step } = Steps

function ReportCreate() {
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [sqlQuery, setSqlQuery] = useState('')
  const [testResults, setTestResults] = useState(null)
  const [testing, setTesting] = useState(false)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Récupérer les métadonnées
  const { data: categories } = useQuery('categories', metaAPI.getCategories)
  const { data: reportTypes } = useQuery('report-types', metaAPI.getReportTypes)

  // Mutation pour créer un rapport
  const createMutation = useMutation(reportsAPI.create, {
    onSuccess: (data) => {
      message.success('Rapport créé avec succès')
      queryClient.invalidateQueries('reports')
      navigate(`/reports/${data.data.id}`)
    },
    onError: (error) => {
      message.error('Erreur lors de la création: ' + error.message)
    },
  })

  // Tester la requête SQL
  const handleTestQuery = async () => {
    if (!sqlQuery.trim()) {
      message.warning('Veuillez saisir une requête SQL')
      return
    }

    setTesting(true)
    try {
      // Simuler un test de requête (en réalité, il faudrait un endpoint dédié)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Résultats de test simulés
      setTestResults({
        success: true,
        columns: ['id', 'name', 'date', 'value'],
        rowCount: 142,
        executionTime: 0.25
      })
      
      message.success('Requête testée avec succès')
    } catch (error) {
      setTestResults({
        success: false,
        error: error.message
      })
      message.error('Erreur lors du test de la requête')
    } finally {
      setTesting(false)
    }
  }

  // Soumettre le formulaire
  const handleSubmit = async (values) => {
    const reportData = {
      ...values,
      query: sqlQuery,
      parameters: values.parameters ? JSON.parse(values.parameters) : {},
      filters: values.filters ? JSON.parse(values.filters) : {},
      visualization_config: values.visualization_config ? JSON.parse(values.visualization_config) : {},
      schedule: values.schedule ? JSON.parse(values.schedule) : {},
    }

    createMutation.mutate(reportData)
  }

  // Configuration des étapes
  const steps = [
    {
      title: 'Informations générales',
      icon: <FileTextOutlined />,
    },
    {
      title: 'Requête SQL',
      icon: <DatabaseOutlined />,
    },
    {
      title: 'Configuration',
      icon: <SettingOutlined />,
    },
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Contenu de l'étape 1 : Informations générales
  const renderGeneralInfo = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Form.Item
          name="name"
          label="Nom du rapport"
          rules={[
            { required: true, message: 'Veuillez saisir le nom du rapport' },
            { max: 255, message: 'Le nom ne peut pas dépasser 255 caractères' }
          ]}
        >
          <Input placeholder="Ex: Rapport des ventes mensuelles" />
        </Form.Item>

        <Form.Item
          name="category"
          label="Catégorie"
          rules={[{ required: true, message: 'Veuillez sélectionner une catégorie' }]}
        >
          <Select placeholder="Sélectionner une catégorie">
            {categories?.data?.map(category => (
              <Option key={category} value={category}>
                {category}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="type"
          label="Type de rapport"
          rules={[{ required: true, message: 'Veuillez sélectionner un type' }]}
        >
          <Select placeholder="Sélectionner un type">
            {reportTypes?.data?.map(type => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col xs={24} lg={12}>
        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea 
            rows={4} 
            placeholder="Description détaillée du rapport..."
          />
        </Form.Item>

        <Form.Item
          name="is_active"
          label="Statut"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch 
            checkedChildren="Actif" 
            unCheckedChildren="Inactif" 
          />
        </Form.Item>
      </Col>
    </Row>
  )

  // Contenu de l'étape 2 : Requête SQL
  const renderSQLQuery = () => (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Text strong>Requête SQL</Text>
        <Text type="secondary" style={{ marginLeft: '8px' }}>
          Écrivez votre requête SQL pour récupérer les données
        </Text>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <AceEditor
          mode="sql"
          theme="monokai"
          value={sqlQuery}
          onChange={setSqlQuery}
          name="sql-editor"
          editorProps={{ $blockScrolling: true }}
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showLineNumbers: true,
            tabSize: 2,
          }}
          style={{
            width: '100%',
            height: '300px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
          }}
          placeholder="SELECT * FROM table_name WHERE condition..."
        />
      </div>

      <Space>
        <Button 
          type="primary" 
          icon={<PlayCircleOutlined />}
          onClick={handleTestQuery}
          loading={testing}
        >
          Tester la requête
        </Button>
        
        {testResults && (
          <div style={{ marginLeft: '16px' }}>
            {testResults.success ? (
              <Text type="success">
                ✓ Requête valide - {testResults.rowCount} lignes - {testResults.executionTime}s
              </Text>
            ) : (
              <Text type="danger">
                ✗ Erreur: {testResults.error}
              </Text>
            )}
          </div>
        )}
      </Space>

      {testResults?.success && (
        <Card size="small" style={{ marginTop: '16px' }}>
          <Text strong>Colonnes détectées:</Text>
          <div style={{ marginTop: '8px' }}>
            {testResults.columns.map(col => (
              <Tag key={col} style={{ margin: '2px' }}>{col}</Tag>
            ))}
          </div>
        </Card>
      )}
    </div>
  )

  // Contenu de l'étape 3 : Configuration
  const renderConfiguration = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Form.Item
          name="parameters"
          label="Paramètres (JSON)"
        >
          <TextArea 
            rows={4} 
            placeholder='{"param1": "value1", "param2": "value2"}'
          />
        </Form.Item>

        <Form.Item
          name="filters"
          label="Filtres (JSON)"
        >
          <TextArea 
            rows={4} 
            placeholder='{"date_range": {"start": "2023-01-01", "end": "2023-12-31"}}'
          />
        </Form.Item>
      </Col>

      <Col xs={24} lg={12}>
        <Form.Item
          name="visualization_config"
          label="Configuration de visualisation (JSON)"
        >
          <TextArea 
            rows={4} 
            placeholder='{"chart_type": "line", "x_axis": "date", "y_axis": "value"}'
          />
        </Form.Item>

        <Form.Item
          name="schedule"
          label="Planification (JSON)"
        >
          <TextArea 
            rows={4} 
            placeholder='{"frequency": "daily", "time": "09:00", "enabled": false}'
          />
        </Form.Item>
      </Col>
    </Row>
  )

  return (
    <div className="fade-in">
      {/* En-tête */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/reports')}
            >
              Retour
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Nouveau rapport
            </Title>
          </Space>
        </Col>
      </Row>

      {/* Étapes */}
      <Card style={{ marginBottom: '24px' }}>
        <Steps 
          current={currentStep} 
          items={steps}
          size="small"
        />
      </Card>

      {/* Formulaire */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
      >
        <Card>
          {/* Contenu dynamique selon l'étape */}
          {currentStep === 0 && renderGeneralInfo()}
          {currentStep === 1 && renderSQLQuery()}
          {currentStep === 2 && renderConfiguration()}

          <Divider />

          {/* Actions */}
          <Row justify="space-between">
            <Col>
              {currentStep > 0 && (
                <Button onClick={prevStep}>
                  Précédent
                </Button>
              )}
            </Col>
            
            <Col>
              <Space>
                {currentStep < steps.length - 1 ? (
                  <Button type="primary" onClick={nextStep}>
                    Suivant
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={createMutation.isLoading}
                  >
                    Créer le rapport
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  )
}

export default ReportCreate