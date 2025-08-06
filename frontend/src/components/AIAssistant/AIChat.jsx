import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageOutlined, 
  SendOutlined, 
  LoadingOutlined, 
  BulbOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
  StarOutlined,
  StarFilled,
  CopyOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { 
  Card, 
  Input, 
  Button, 
  List, 
  Avatar, 
  Typography, 
  Space, 
  Tag, 
  Tooltip, 
  Rate,
  Modal,
  message,
  Badge,
  Divider,
  Progress,
  Spin
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import './AIChat.css';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [usageStats, setUsageStats] = useState(null);
  const [showRating, setShowRating] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [feedback, setFeedback] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Charger les suggestions et statistiques au démarrage
  useEffect(() => {
    loadSuggestions();
    loadUsageStats();
  }, []);

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/ai/suggestions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des suggestions:', error);
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await fetch('/api/ai/usage-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          conversation_id: conversationId
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.message,
          timestamp: new Date(),
          suggestions: data.suggestions,
          provider: data.provider,
          tokens_used: data.tokens_used
        };

        setMessages(prev => [...prev, aiMessage]);
        setConversationId(data.conversation_id);
        
        // Mettre à jour les statistiques
        loadUsageStats();
      } else {
        // Gestion des erreurs
        const errorMessage = {
          id: Date.now() + 1,
          type: 'error',
          content: data.error?.message || 'Une erreur est survenue',
          timestamp: new Date(),
          errorCode: data.error?.code
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Impossible de se connecter à l\'assistant IA. Veuillez réessayer.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion.text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Contenu copié dans le presse-papiers');
  };

  const handleRateMessage = async (messageIndex, rating, feedbackText) => {
    try {
      const response = await fetch('/api/ai/rate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_index: messageIndex,
          rating: rating,
          feedback: feedbackText
        })
      });

      if (response.ok) {
        message.success('Merci pour votre évaluation !');
        setShowRating(null);
        setRatingValue(0);
        setFeedback('');
      }
    } catch (error) {
      console.error('Erreur lors de l\'évaluation:', error);
      message.error('Impossible d\'enregistrer votre évaluation');
    }
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.type === 'user';
    const isError = msg.type === 'error';

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`ai-message ${isUser ? 'user-message' : 'assistant-message'} ${isError ? 'error-message' : ''}`}
      >
        <div className="message-header">
          <Avatar 
            size="small"
            icon={isUser ? <MessageOutlined /> : <ThunderboltOutlined />}
            className={isUser ? 'user-avatar' : 'ai-avatar'}
          />
          <Space>
            <Text strong>{isUser ? 'Vous' : isError ? 'Erreur' : 'Assistant IA EPE'}</Text>
            <Text type="secondary" className="message-time">
              {msg.timestamp.toLocaleTimeString()}
            </Text>
            {msg.provider && (
              <Tag color="blue" size="small">{msg.provider.toUpperCase()}</Tag>
            )}
          </Space>
        </div>

        <div className="message-content">
          <Paragraph>
            {msg.content}
          </Paragraph>

          {!isUser && !isError && (
            <div className="message-actions">
              <Space>
                <Tooltip title="Copier">
                  <Button 
                    type="text" 
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(msg.content)}
                  />
                </Tooltip>
                
                <Tooltip title="Évaluer cette réponse">
                  <Button 
                    type="text" 
                    size="small"
                    icon={<StarOutlined />}
                    onClick={() => setShowRating(index)}
                  />
                </Tooltip>

                {msg.tokens_used && (
                  <Text type="secondary" className="tokens-info">
                    {msg.tokens_used} tokens
                  </Text>
                )}
              </Space>
            </div>
          )}

          {msg.suggestions && msg.suggestions.length > 0 && (
            <div className="message-suggestions">
              <Text type="secondary">Questions suggérées :</Text>
              <div className="suggestions-list">
                {msg.suggestions.map((suggestion, idx) => (
                  <Tag 
                    key={idx}
                    className="suggestion-tag"
                    onClick={() => handleSuggestionClick({ text: suggestion })}
                  >
                    {suggestion}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderSuggestions = () => {
    if (messages.length > 0 || suggestions.length === 0) return null;

    return (
      <div className="initial-suggestions">
        <div className="suggestions-header">
          <BulbOutlined className="suggestions-icon" />
          <Text strong>Questions suggérées pour commencer :</Text>
        </div>
        <div className="suggestions-grid">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                size="small"
                hoverable
                className={`suggestion-card ${suggestion.category}`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <Text>{suggestion.text}</Text>
                <Tag color="blue" size="small" className="category-tag">
                  {suggestion.category}
                </Tag>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderUsageStats = () => {
    if (!usageStats || !usageStats.available) return null;

    const percentage = (usageStats.usage / usageStats.limit) * 100;
    const color = percentage > 80 ? 'red' : percentage > 60 ? 'orange' : 'green';

    return (
      <div className="usage-stats">
        <Space>
          <Text type="secondary">Utilisation IA :</Text>
          <Progress 
            percent={percentage} 
            size="small" 
            strokeColor={color}
            format={() => `${usageStats.usage}/${usageStats.limit}`}
          />
        </Space>
      </div>
    );
  };

  return (
    <div className="ai-chat-container">
      <Card 
        title={
          <Space>
            <ThunderboltOutlined />
            <span>Assistant IA Expert EPE</span>
            <Badge count="Beta" style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        extra={renderUsageStats()}
        className="ai-chat-card"
      >
        <div className="chat-messages">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="welcome-message"
              >
                <div className="welcome-content">
                  <ThunderboltOutlined className="welcome-icon" />
                  <Text strong>Bonjour ! Je suis votre assistant IA spécialisé en gouvernance EPE.</Text>
                  <Text type="secondary">
                    Je peux vous aider avec la réglementation OHADA/UEMOA, la gouvernance d'entreprise, 
                    le reporting SYSCOHADA et bien plus encore.
                  </Text>
                </div>
              </motion.div>
            )}

            {renderSuggestions()}

            {messages.map((message, index) => renderMessage(message, index))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="loading-message"
            >
              <Avatar icon={<LoadingOutlined spin />} className="ai-avatar" />
              <Space>
                <Spin size="small" />
                <Text type="secondary">L'assistant réfléchit...</Text>
              </Space>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <Divider className="chat-divider" />

        <div className="chat-input">
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question sur la gouvernance EPE, OHADA, UEMOA..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={isLoading || (usageStats && !usageStats.available)}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => sendMessage()}
              loading={isLoading}
              disabled={!inputMessage.trim() || (usageStats && !usageStats.available)}
            >
              Envoyer
            </Button>
          </Space.Compact>

          {usageStats && !usageStats.available && (
            <Text type="danger" className="usage-limit-message">
              Limite d'utilisation atteinte. Upgrader votre plan pour continuer.
            </Text>
          )}
        </div>
      </Card>

      {/* Modal d'évaluation */}
      <Modal
        title="Évaluer cette réponse"
        open={showRating !== null}
        onCancel={() => {
          setShowRating(null);
          setRatingValue(0);
          setFeedback('');
        }}
        onOk={() => handleRateMessage(showRating, ratingValue, feedback)}
        okText="Envoyer l'évaluation"
        cancelText="Annuler"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Note globale :</Text>
            <br />
            <Rate 
              value={ratingValue} 
              onChange={setRatingValue}
              character={<StarFilled />}
            />
          </div>
          
          <div>
            <Text strong>Commentaires (optionnel) :</Text>
            <TextArea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Que pensez-vous de cette réponse ? Comment pouvons-nous l'améliorer ?"
              rows={3}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default AIChat;