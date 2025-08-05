import React from 'react'
import { Card, Typography } from 'antd'
import { useAuth } from '../../hooks/useAuth'

const { Title } = Typography

function ProfilePage() {
  const { user } = useAuth()

  return (
    <div>
      <Title level={2}>Profil de {user?.name}</Title>
      <Card>
        <p>Email: {user?.email}</p>
        <p>Rôle: {user?.role}</p>
        <p>Département: {user?.department}</p>
      </Card>
    </div>
  )
}

export default ProfilePage