import React from 'react'
import { Card, Typography, Skeleton, Space, Tag, Button } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { templatesAPI } from '../../services/api'
import ReactMarkdown from 'react-markdown'

const { Title, Text } = Typography

function TemplateViewer() {
	const { id } = useParams()
	const navigate = useNavigate()
	const { data, isLoading } = useQuery(['template', id], ()=> templatesAPI.getById(id), { enabled: !!id })
	const tpl = data?.data

	return (
		<Card title={<Space><Button onClick={()=>navigate(-1)}>Retour</Button><Title level={4} style={{ margin: 0 }}>{tpl?.name || 'Modèle'}</Title>{tpl?.type && <Tag>{tpl.type}</Tag>}</Space>}>
			{isLoading ? (
				<Skeleton active paragraph={{ rows: 8 }} />
			) : tpl?.format === 'markdown' ? (
				<div className="markdown-body">
					<ReactMarkdown>{tpl?.content || ''}</ReactMarkdown>
				</div>
			) : (
				<Text type="secondary">Aucun contenu disponible.</Text>
			)}
		</Card>
	)
}

export default TemplateViewer