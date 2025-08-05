import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  Form,
  Input,
  Modal,
  Tabs,
  Table,
  Tag,
  Space,
  Spin,
  message,
  Upload,
  Typography,
  Divider,
  Progress,
  Alert,
  Tooltip,
  Badge,
  Empty,
} from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  FilterOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  GlobalOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentTemplateAPI } from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const DocumentTemplates = () => {
  const [form] = Form.useForm();
  const [customForm] = Form.useForm();
  const queryClient = useQueryClient();

  // États locaux
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEntityType, setSelectedEntityType] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [generatingDocument, setGeneratingDocument] = useState(false);

  // Requêtes API
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['document-templates', selectedCategory, selectedEntityType],
    queryFn: () => documentTemplateAPI.getTemplates({
      category: selectedCategory,
      entity_type: selectedEntityType,
    }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['document-template-categories'],
    queryFn: () => documentTemplateAPI.getCategories(),
  });

  const { data: statisticsData } = useQuery({
    queryKey: ['document-template-statistics'],
    queryFn: () => documentTemplateAPI.getStatistics(),
  });

  // Mutations
  const generateDocumentMutation = useMutation({
    mutationFn: documentTemplateAPI.generateDocument,
    onSuccess: (data) => {
      message.success('Document généré avec succès !');
      setGenerateModalVisible(false);
      form.resetFields();
      
      // Télécharger automatiquement
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      }
    },
    onError: (error) => {
      message.error('Erreur lors de la génération : ' + error.message);
    },
    onSettled: () => {
      setGeneratingDocument(false);
    },
  });

  const generateCustomMutation = useMutation({
    mutationFn: documentTemplateAPI.generateCustomDocument,
    onSuccess: (data) => {
      message.success('Document personnalisé généré avec succès !');
      setCustomModalVisible(false);
      customForm.resetFields();
      
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      }
    },
    onError: (error) => {
      message.error('Erreur lors de la génération : ' + error.message);
    },
  });

  const previewMutation = useMutation({
    mutationFn: documentTemplateAPI.previewDocument,
    onSuccess: (data) => {
      setPreviewContent(data.html_content);
      setPreviewModalVisible(true);
    },
    onError: (error) => {
      message.error('Erreur lors de l\'aperçu : ' + error.message);
    },
  });

  // Gestion de la génération de document
  const handleGenerateDocument = async (values) => {
    setGeneratingDocument(true);
    
    const payload = {
      template_key: selectedTemplate.key,
      format: values.format,
      entity_id: values.entity_id,
      exercice: values.exercice,
      data: values.data || {},
    };

    await generateDocumentMutation.mutateAsync(payload);
  };

  // Gestion de l'aperçu
  const handlePreview = async (templateKey) => {
    const formValues = form.getFieldsValue();
    
    const payload = {
      template_key: templateKey,
      entity_id: formValues.entity_id,
      exercice: formValues.exercice,
      data: formValues.data || {},
    };

    await previewMutation.mutateAsync(payload);
  };

  // Gestion du document personnalisé
  const handleGenerateCustom = async (values) => {
    await generateCustomMutation.mutateAsync(values);
  };

  // Obtenir l'icône selon le format
  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf': return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'docx': return <FileWordOutlined style={{ color: '#1890ff' }} />;
      case 'excel': return <FileExcelOutlined style={{ color: '#52c41a' }} />;
      case 'html': return <GlobalOutlined style={{ color: '#722ed1' }} />;
      default: return <FileTextOutlined />;
    }
  };

  // Obtenir la couleur selon la catégorie
  const getCategoryColor = (category) => {
    const colors = {
      'Sessions Budgétaires': 'blue',
      'Arrêt des Comptes': 'green',
      'Assemblées Générales': 'orange',
      'Conformité UEMOA': 'purple',
      'Comptabilité des Matières': 'cyan',
      'Audit et Contrôle': 'red',
    };
    return colors[category] || 'default';
  };

  // Rendu des cartes de templates
  const renderTemplateCard = (templateKey, template) => (
    <Col xs={24} sm={12} lg={8} xl={6} key={templateKey}>
      <Card
        size="small"
        hoverable
        actions={[
          <Tooltip title="Aperçu">
            <EyeOutlined 
              onClick={() => {
                setSelectedTemplate({ key: templateKey, ...template });
                handlePreview(templateKey);
              }}
            />
          </Tooltip>,
          <Tooltip title="Générer">
            <DownloadOutlined 
              onClick={() => {
                setSelectedTemplate({ key: templateKey, ...template });
                setGenerateModalVisible(true);
              }}
            />
          </Tooltip>,
        ]}
      >
        <Card.Meta
          avatar={getFormatIcon(template.format[0])}
          title={
            <div>
              <Text strong style={{ fontSize: '12px' }}>
                {template.name}
              </Text>
              <br />
              <Tag 
                color={getCategoryColor(template.category)} 
                size="small"
                style={{ marginTop: 4 }}
              >
                {template.category}
              </Tag>
            </div>
          }
          description={
            <div>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Type: {template.type === 'all' ? 'Tous' : template.type}
              </Text>
              <br />
              <Space size="small" style={{ marginTop: 4 }}>
                {template.format.map(format => (
                  <Tag key={format} size="small">
                    {format.toUpperCase()}
                  </Tag>
                ))}
              </Space>
            </div>
          }
        />
      </Card>
    </Col>
  );

  // Colonnes pour le tableau de statistiques
  const statisticsColumns = [
    {
      title: 'Catégorie',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color={getCategoryColor(category)}>{category}</Tag>
      ),
    },
    {
      title: 'Utilisation',
      dataIndex: 'usage',
      key: 'usage',
      render: (usage) => (
        <Progress 
          percent={usage} 
          size="small" 
          format={percent => `${percent} docs`}
        />
      ),
    },
  ];

  const templates = templatesData?.data || {};
  const categories = categoriesData?.data || {};
  const statistics = statisticsData?.data || {};

  return (
    <div style={{ padding: '24px' }}>
      {/* En-tête */}
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <Title level={2} style={{ margin: 0 }}>
            <BookOutlined /> Templates de Documents EPE
          </Title>
          <Text type="secondary">
            Génération automatisée de documents conformes SYSCOHADA/UEMOA
          </Text>
        </Col>
        <Col>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCustomModalVisible(true)}
            >
              Document Personnalisé
            </Button>
            <Button icon={<SettingOutlined />}>
              Paramètres
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Statistiques rapides */}
      {statistics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                  {statistics.total_templates}
                </Title>
                <Text type="secondary">Templates disponibles</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                  {statistics.categories_count}
                </Title>
                <Text type="secondary">Catégories</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card 
              size="small" 
              title="Formats les plus utilisés"
              style={{ height: '100%' }}
            >
              <Space>
                {Object.entries(statistics.formats_usage || {}).map(([format, count]) => (
                  <div key={format} style={{ textAlign: 'center' }}>
                    {getFormatIcon(format)}
                    <br />
                    <Text strong>{count}%</Text>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* Filtres */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 8]} align="middle">
          <Col xs={24} sm={6}>
            <Select
              placeholder="Filtrer par catégorie"
              allowClear
              style={{ width: '100%' }}
              value={selectedCategory}
              onChange={setSelectedCategory}
            >
              {Object.keys(categories).map(category => (
                <Option key={category} value={category}>
                  <Badge 
                    count={Object.keys(categories[category]).length} 
                    size="small"
                    style={{ marginLeft: 8 }}
                  >
                    {category}
                  </Badge>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Type d'entité"
              allowClear
              style={{ width: '100%' }}
              value={selectedEntityType}
              onChange={setSelectedEntityType}
            >
              <Option value="societe_etat">Société d'État</Option>
              <Option value="etablissement_public">Établissement Public</Option>
              <Option value="autres">Autres</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">
              {Object.keys(templates).length} template(s) affiché(s)
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Onglets principaux */}
      <Tabs defaultActiveKey="templates">
        <TabPane tab="Templates Disponibles" key="templates">
          <Spin spinning={templatesLoading}>
            {Object.keys(templates).length > 0 ? (
              <Row gutter={[16, 16]}>
                {Object.entries(templates).map(([key, template]) =>
                  renderTemplateCard(key, template)
                )}
              </Row>
            ) : (
              <Empty 
                description="Aucun template trouvé avec ces critères"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Spin>
        </TabPane>

        <TabPane tab="Par Catégories" key="categories">
          {Object.entries(categories).map(([categoryName, categoryTemplates]) => (
            <Card 
              key={categoryName}
              title={
                <Badge 
                  count={Object.keys(categoryTemplates).length}
                  style={{ backgroundColor: getCategoryColor(categoryName) }}
                >
                  {categoryName}
                </Badge>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Row gutter={[16, 16]}>
                {Object.entries(categoryTemplates).map(([key, template]) =>
                  renderTemplateCard(key, template)
                )}
              </Row>
            </Card>
          ))}
        </TabPane>

        <TabPane tab="Statistiques" key="statistics">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Utilisation par catégorie">
                <Table
                  size="small"
                  columns={statisticsColumns}
                  dataSource={Object.entries(statistics.usage_by_category || {}).map(([category, usage]) => ({
                    key: category,
                    category,
                    usage,
                  }))}
                  pagination={false}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Templates les plus utilisés">
                {statistics.most_used?.map((templateKey, index) => (
                  <div key={templateKey} style={{ marginBottom: 8 }}>
                    <Badge count={index + 1} style={{ backgroundColor: '#52c41a' }}>
                      <Text>{templates[templateKey]?.name || templateKey}</Text>
                    </Badge>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Modal de génération */}
      <Modal
        title={`Générer: ${selectedTemplate?.name}`}
        open={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={generatingDocument}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateDocument}
        >
          <Alert
            message="Informations requises"
            description={`Cadre réglementaire: ${selectedTemplate?.compliance?.join(', ')}`}
            type="info"
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="format"
                label="Format de sortie"
                rules={[{ required: true, message: 'Format requis' }]}
              >
                <Select placeholder="Choisir le format">
                  {selectedTemplate?.format?.map(format => (
                    <Option key={format} value={format}>
                      {getFormatIcon(format)} {format.toUpperCase()}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="exercice"
                label="Exercice"
                rules={[{ required: true, message: 'Exercice requis' }]}
              >
                <Select placeholder="Année">
                  {[2023, 2024, 2025].map(year => (
                    <Option key={year} value={year}>{year}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="entity_id"
            label="Entité (optionnel)"
          >
            <Select 
              placeholder="Sélectionner une entité EPE"
              allowClear
              showSearch
            >
              {/* Les entités seraient chargées depuis l'API */}
            </Select>
          </Form.Item>

          <Form.Item
            name="data"
            label="Données supplémentaires (JSON)"
          >
            <TextArea 
              rows={4} 
              placeholder='{"key": "value"}' 
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal document personnalisé */}
      <Modal
        title="Créer un Document Personnalisé"
        open={customModalVisible}
        onCancel={() => setCustomModalVisible(false)}
        onOk={() => customForm.submit()}
        confirmLoading={generateCustomMutation.isPending}
        width={800}
      >
        <Form
          form={customForm}
          layout="vertical"
          onFinish={handleGenerateCustom}
        >
          <Form.Item
            name="title"
            label="Titre du document"
            rules={[{ required: true, message: 'Titre requis' }]}
          >
            <Input placeholder="Ex: Rapport d'activité trimestriel" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="format"
                label="Format"
                rules={[{ required: true, message: 'Format requis' }]}
              >
                <Select>
                  <Option value="pdf">PDF</Option>
                  <Option value="docx">Word</Option>
                  <Option value="html">HTML</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Catégorie"
              >
                <Input placeholder="Ex: Rapport personnalisé" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="Contenu du document"
            rules={[{ required: true, message: 'Contenu requis' }]}
          >
            <TextArea 
              rows={10} 
              placeholder="Saisir le contenu en HTML ou texte brut..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal d'aperçu */}
      <Modal
        title="Aperçu du Document"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width="90%"
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Fermer
          </Button>
        ]}
      >
        <div 
          style={{ 
            maxHeight: '70vh', 
            overflow: 'auto',
            border: '1px solid #d9d9d9',
            padding: '16px',
            backgroundColor: '#fff'
          }}
          dangerouslySetInnerHTML={{ __html: previewContent }}
        />
      </Modal>
    </div>
  );
};

export default DocumentTemplates;