import React from 'react'
import { Card, Typography } from 'antd'

const { Title } = Typography

function ScheduleCreate() {
  return (
    <div>
      <Title level={2}>Nouvelle planification</Title>
      <Card>
        <p>Page de création de planification en développement...</p>
        <p>Cette page permettra de :</p>
        <ul>
          <li>Sélectionner un rapport à planifier</li>
          <li>Configurer la fréquence d'exécution</li>
          <li>Définir les destinataires des notifications</li>
          <li>Choisir le format d'export</li>
          <li>Paramétrer les options avancées</li>
        </ul>
      </Card>
    </div>
  )
}

export default ScheduleCreate