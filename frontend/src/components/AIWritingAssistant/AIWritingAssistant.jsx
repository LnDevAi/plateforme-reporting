import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Spin,
  Alert,
  Typography,
  Space,
  Row,
  Col,
  Modal,
  Tag,
  Divider,
  Progress,
  List,
  Tooltip,
  Drawer,
  Form,
  message,
  Collapse,
  Badge,
  Avatar,
} from 'antd';
import {
  RobotOutlined,
  EditOutlined,
  CheckCircleOutlined,
  LightbulbOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CloseOutlined,
  ReloadOutlined,
  SettingOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { aiWritingAssistantAPI } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

const AIWritingAssistant = ({ 
  templateKey, 
  entityId, 
  exercice,
  visible, 
  onClose,
  onContentGenerated,
  currentContent = '',
  sectionType = 'general' 
}) => {
  const [form] = Form.useForm();
  
  // États locaux
  const [activeTab, setActiveTab] = useState('generate');
  const [generatedContent, setGeneratedContent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [complianceResults, setComplianceResults] = useState(null);
  const [assistantMode, setAssistantMode] = useState('suggestions'); // 'suggestions', 'generate', 'improve', 'compliance'

  // Requêtes et mutations
  const { data: contextsData } = useQuery({
    queryKey: ['ai-assistant-contexts'],
    queryFn: () => aiWritingAssistantAPI.getContexts(),
    enabled: visible,
  });

  const generateContentMutation = useMutation({
    mutationFn: aiWritingAssistantAPI.generateContent,
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedContent(data.data.content);
        setSuggestions(data.data.suggestions || []);
        message.success('Contenu généré avec succès par l\'IA !');
      } else {
        message.error('Erreur lors de la génération : ' + data.error);
      }
    },
    onError: (error) => {
      message.error('Erreur IA : ' + error.message);
    },
  });

  const improveContentMutation = useMutation({
    mutationFn: aiWritingAssistantAPI.improveContent,
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedContent(data.data.improved_content);
        message.success(`Contenu amélioré (Score: ${Math.round(data.data.improvement_score * 100)}%)`);
      }
    },
    onError: (error) => {
      message.error('Erreur lors de l\'amélioration : ' + error.message);
    },
  });

  const getSuggestionsMutation = useMutation({
    mutationFn: aiWritingAssistantAPI.getSuggestions,
    onSuccess: (data) => {
      if (data.success) {
        setSuggestions(data.data.suggestions);
        message.success('Suggestions générées avec succès !');
      }
    },
    onError: (error) => {
      message.error('Erreur lors des suggestions : ' + error.message);
    },
  });

  const analyzeComplianceMutation = useMutation({
    mutationFn: aiWritingAssistantAPI.analyzeCompliance,
    onSuccess: (data) => {
      if (data.success) {
        setComplianceResults(data.data);
        message.success('Analyse de conformité terminée');
      }
    },
    onError: (error) => {
      message.error('Erreur lors de l\'analyse : ' + error.message);
    },
  });

  // Gestion de la génération de contenu
  const handleGenerateContent = async (values) => {
    const payload = {
      template_key: templateKey,
      entity_id: entityId,
      exercice: exercice,
      section_type: values.section_type || sectionType,
      context_data: values.context_data || {},
    };

    await generateContentMutation.mutateAsync(payload);
  };

  // Gestion de l'amélioration de contenu
  const handleImproveContent = async () => {
    if (!currentContent) {
      message.warning('Aucun contenu à améliorer');
      return;
    }

    const payload = {
      content: currentContent,
      template_key: templateKey,
      entity_id: entityId,
      exercice: exercice,
    };

    await improveContentMutation.mutateAsync(payload);
  };

  // Gestion des suggestions
  const handleGetSuggestions = async (sectionType) => {
    const payload = {
      template_key: templateKey,
      section_type: sectionType,
      entity_id: entityId,
      exercice: exercice,
    };

    await getSuggestionsMutation.mutateAsync(payload);
  };

  // Gestion de l'analyse de conformité
  const handleAnalyzeCompliance = async () => {
    if (!currentContent) {
      message.warning('Aucun contenu à analyser');
      return;
    }

    const payload = {
      content: currentContent,
      template_key: templateKey,
      entity_id: entityId,
    };

    await analyzeComplianceMutation.mutateAsync(payload);
  };

  // Appliquer le contenu généré
  const handleApplyContent = () => {
    if (generatedContent && onContentGenerated) {
      onContentGenerated(generatedContent);
      message.success('Contenu appliqué avec succès');
    }
  };

  // Obtenir l'icône selon le type de suggestion
  const getSuggestionIcon = (type) => {
    const icons = {
      key_point: <StarOutlined style={{ color: '#1890ff' }} />,
      regulatory: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      indicator: <ThunderboltOutlined style={{ color: '#722ed1' }} />,
      recommendation: <LightbulbOutlined style={{ color: '#fa8c16' }} />,
    };
    return icons[type] || <FileTextOutlined />;
  };

  // Obtenir la couleur selon le niveau de conformité
  const getComplianceColor = (level) => {
    const colors = {
      error: 'error',
      warning: 'warning',
      info: 'processing',
      success: 'success',
    };
    return colors[level] || 'default';
  };

  const currentContext = contextsData?.data?.[templateKey];

  return (
    <Drawer
      title={
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>
            <RobotOutlined />
          </Avatar>
          <span>Assistant IA de Rédaction</span>
          <Tag color="blue">{currentContext?.display_name || templateKey}</Tag>
        </Space>
      }
      width={600}
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          <Tooltip title="Paramètres IA">
            <Button icon={<SettingOutlined />} size="small" />
          </Tooltip>
        </Space>
      }
    >
      {/* Contexte du document */}
      {currentContext && (
        <Alert
          message="Contexte IA Spécialisé"
          description={
            <div>
              <Text strong>Expert :</Text> {currentContext.expertise}<br />
              <Text strong>Cadre :</Text> {currentContext.framework}<br />
              <Text strong>Focus :</Text> {currentContext.focus}
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Modes d'assistance */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={8}>
          <Col span={6}>
            <Button 
              type={assistantMode === 'suggestions' ? 'primary' : 'default'}
              icon={<LightbulbOutlined />}
              size="small"
              block
              onClick={() => setAssistantMode('suggestions')}
            >
              Suggestions
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              type={assistantMode === 'generate' ? 'primary' : 'default'}
              icon={<EditOutlined />}
              size="small"
              block
              onClick={() => setAssistantMode('generate')}
            >
              Générer
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              type={assistantMode === 'improve' ? 'primary' : 'default'}
              icon={<ThunderboltOutlined />}
              size="small"
              block
              onClick={() => setAssistantMode('improve')}
            >
              Améliorer
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              type={assistantMode === 'compliance' ? 'primary' : 'default'}
              icon={<CheckCircleOutlined />}
              size="small"
              block
              onClick={() => setAssistantMode('compliance')}
            >
              Vérifier
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Mode Suggestions */}
      {assistantMode === 'suggestions' && (
        <Card title="💡 Suggestions Contextuelles" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              placeholder="Choisir une section"
              style={{ width: '100%' }}
              onChange={handleGetSuggestions}
            >
              {currentContext?.available_sections?.map(section => (
                <Option key={section} value={section}>
                  {section.replace('_', ' ').toUpperCase()}
                </Option>
              ))}
            </Select>

            <Spin spinning={getSuggestionsMutation.isPending}>
              <List
                size="small"
                dataSource={suggestions}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={getSuggestionIcon(item.type)}
                      title={<Text strong>{item.type?.replace('_', ' ')}</Text>}
                      description={item.content}
                    />
                  </List.Item>
                )}
                locale={{
                  emptyText: 'Aucune suggestion. Sélectionnez une section pour commencer.'
                }}
              />
            </Spin>
          </Space>
        </Card>
      )}

      {/* Mode Génération */}
      {assistantMode === 'generate' && (
        <Card title="✨ Génération de Contenu" size="small">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleGenerateContent}
          >
            <Form.Item
              name="section_type"
              label="Type de section"
            >
              <Select placeholder="Sélectionner le type de section">
                {currentContext?.available_sections?.map(section => (
                  <Option key={section} value={section}>
                    {section.replace('_', ' ').toUpperCase()}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={generateContentMutation.isPending}
                icon={<RobotOutlined />}
                block
              >
                Générer avec l'IA
              </Button>
            </Form.Item>
          </Form>

          {generatedContent && (
            <div style={{ marginTop: 16 }}>
              <Divider orientation="left">
                <Text strong>Contenu Généré</Text>
              </Divider>
              <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                <Paragraph style={{ marginBottom: 8, whiteSpace: 'pre-wrap' }}>
                  {generatedContent}
                </Paragraph>
                <Button 
                  type="primary" 
                  icon={<CheckOutlined />}
                  onClick={handleApplyContent}
                  size="small"
                >
                  Appliquer ce contenu
                </Button>
              </Card>
            </div>
          )}
        </Card>
      )}

      {/* Mode Amélioration */}
      {assistantMode === 'improve' && (
        <Card title="⚡ Amélioration de Contenu" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            {currentContent ? (
              <>
                <Text type="secondary">
                  Contenu actuel ({currentContent.length} caractères)
                </Text>
                <Button 
                  type="primary" 
                  icon={<ThunderboltOutlined />}
                  loading={improveContentMutation.isPending}
                  onClick={handleImproveContent}
                  block
                >
                  Améliorer avec l'IA
                </Button>
              </>
            ) : (
              <Alert
                message="Aucun contenu à améliorer"
                description="Rédigez d'abord du contenu dans l'éditeur principal"
                type="warning"
                showIcon
              />
            )}

            {generatedContent && (
              <div>
                <Divider orientation="left">
                  <Text strong>Version Améliorée</Text>
                </Divider>
                <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                  <Paragraph style={{ marginBottom: 8, whiteSpace: 'pre-wrap' }}>
                    {generatedContent}
                  </Paragraph>
                  <Button 
                    type="primary" 
                    icon={<CheckOutlined />}
                    onClick={handleApplyContent}
                    size="small"
                  >
                    Appliquer l'amélioration
                  </Button>
                </Card>
              </div>
            )}
          </Space>
        </Card>
      )}

      {/* Mode Vérification de Conformité */}
      {assistantMode === 'compliance' && (
        <Card title="🔍 Analyse de Conformité" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            {currentContent ? (
              <>
                <Text type="secondary">
                  Analyse du contenu selon les standards SYSCOHADA/UEMOA
                </Text>
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />}
                  loading={analyzeComplianceMutation.isPending}
                  onClick={handleAnalyzeCompliance}
                  block
                >
                  Analyser la Conformité
                </Button>
              </>
            ) : (
              <Alert
                message="Aucun contenu à analyser"
                description="Rédigez d'abord du contenu dans l'éditeur principal"
                type="warning"
                showIcon
              />
            )}

            {complianceResults && (
              <div>
                <Divider orientation="left">
                  <Text strong>Résultats d'Analyse</Text>
                </Divider>
                
                <Card size="small" style={{ marginBottom: 8 }}>
                  <Row align="middle">
                    <Col span={12}>
                      <Text strong>Score de Conformité</Text>
                    </Col>
                    <Col span={12}>
                      <Progress 
                        percent={Math.round(complianceResults.compliance_score * 100)}
                        size="small"
                        status={complianceResults.compliance_score > 0.8 ? 'success' : 'exception'}
                      />
                    </Col>
                  </Row>
                </Card>

                {complianceResults.compliance_issues?.length > 0 && (
                  <Card size="small" title="⚠️ Problèmes Détectés">
                    <List
                      size="small"
                      dataSource={complianceResults.compliance_issues}
                      renderItem={(issue) => (
                        <List.Item>
                          <Alert
                            message={issue.message}
                            type={getComplianceColor(issue.level)}
                            showIcon
                            size="small"
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                )}

                {complianceResults.recommendations?.length > 0 && (
                  <Card size="small" title="💡 Recommandations">
                    <List
                      size="small"
                      dataSource={complianceResults.recommendations}
                      renderItem={(rec) => (
                        <List.Item>
                          <Text>• {rec}</Text>
                        </List.Item>
                      )}
                    />
                  </Card>
                )}
              </div>
            )}
          </Space>
        </Card>
      )}

      {/* Actions rapides */}
      <Divider />
      <Card size="small" title="🚀 Actions Rapides">
        <Space wrap>
          <Button 
            size="small" 
            icon={<LightbulbOutlined />}
            onClick={() => handleGetSuggestions('introduction')}
          >
            Aide Introduction
          </Button>
          <Button 
            size="small" 
            icon={<FileTextOutlined />}
            onClick={() => handleGetSuggestions('conclusion')}
          >
            Aide Conclusion
          </Button>
          <Button 
            size="small" 
            icon={<CheckCircleOutlined />}
            onClick={() => handleGetSuggestions('regulatory')}
          >
            Éléments Réglementaires
          </Button>
        </Space>
      </Card>
    </Drawer>
  );
};

export default AIWritingAssistant;