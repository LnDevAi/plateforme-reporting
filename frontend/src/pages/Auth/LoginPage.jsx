import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, Alert, Row, Col, Divider } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'

const { Title, Text } = Typography

function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Obtenir l'URL de redirection après connexion
  const from = location.state?.from?.pathname || '/dashboard'

  // Gérer la soumission du formulaire
  const handleSubmit = async (values) => {
    setLoading(true)
    clearError()

    try {
      const result = await login({
        email: values.email,
        password: values.password,
      })

      if (result.success) {
        navigate(from, { replace: true })
      }
    } catch (err) {
      // L'erreur est gérée par le contexte d'authentification
      console.error('Erreur de connexion:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%', maxWidth: '1200px' }}>
        <Col xs={24} sm={16} md={12} lg={8} xl={6}>
          <Card
            style={{
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              borderRadius: '12px',
              border: 'none'
            }}
          >
            {/* En-tête */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
                Plateforme de Reporting
              </Title>
              <Text type="secondary">
                Connectez-vous pour accéder à vos rapports
              </Text>
            </div>

            {/* Alerte d'erreur */}
            {error && (
              <Alert
                message="Erreur de connexion"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: '24px' }}
                closable
                onClose={clearError}
              />
            )}

            {/* Formulaire de connexion */}
            <Form
              name="login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
              <Form.Item
                name="email"
                label="Adresse email"
                rules={[
                  {
                    required: true,
                    message: 'Veuillez saisir votre adresse email',
                  },
                  {
                    type: 'email',
                    message: 'Veuillez saisir une adresse email valide',
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="votre.email@exemple.com"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mot de passe"
                rules={[
                  {
                    required: true,
                    message: 'Veuillez saisir votre mot de passe',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '16px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<LoginOutlined />}
                  style={{ width: '100%', height: '48px' }}
                >
                  Se connecter
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            {/* Informations de démonstration */}
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Comptes de démonstration disponibles
              </Text>
              <div style={{ marginTop: '8px', fontSize: '11px' }}>
                <div><strong>Admin:</strong> admin@demo.com / password</div>
                <div><strong>Manager:</strong> manager@demo.com / password</div>
                <div><strong>Analyst:</strong> analyst@demo.com / password</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default LoginPage