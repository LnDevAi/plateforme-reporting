import React, { useEffect, useState, useRef } from 'react'
import { Card, Tabs, Button, List, Input, Space, Tag, message, Divider, Switch, Select } from 'antd'
import { useParams } from 'react-router-dom'
import { sessionsAPI } from '../../services/api'

function JitsiPanel({ room }) {
  const containerRef = useRef(null)
  const apiRef = useRef(null)
  const [desiredPassword, setDesiredPassword] = useState('')
  const [participants, setParticipants] = useState([])
  const [handRaised, setHandRaised] = useState(false)
  const [lobbyEnabled, setLobbyEnabled] = useState(false)

  const startMeeting = () => {
    if (!window.JitsiMeetExternalAPI) {
      message.error('Jitsi API non chargée')
      return
    }
    if (apiRef.current) return
    const domain = 'meet.jit.si'
    apiRef.current = new window.JitsiMeetExternalAPI(domain, {
      roomName: room,
      parentNode: containerRef.current,
      width: '100%',
      height: 420,
      userInfo: { displayName: 'Participant' },
      configOverwrite: { prejoinPageEnabled: true },
      interfaceConfigOverwrite: {}
    })

    const updateParticipants = async () => {
      try {
        const info = await apiRef.current.getParticipantsInfo()
        setParticipants(info || [])
      } catch (_) {}
    }

    apiRef.current.addListener('participantJoined', updateParticipants)
    apiRef.current.addListener('participantLeft', updateParticipants)
    apiRef.current.addListener('participantRoleChanged', updateParticipants)
    apiRef.current.addListener('videoConferenceJoined', () => {
      updateParticipants()
      if (desiredPassword) {
        try { apiRef.current.executeCommand('password', desiredPassword) } catch (_) {}
      }
    })
  }

  const leaveMeeting = () => {
    if (apiRef.current) {
      apiRef.current.dispose()
      apiRef.current = null
      setParticipants([])
    }
  }

  useEffect(() => () => leaveMeeting(), [])

  const copyInvite = async () => {
    const url = `https://meet.jit.si/${room}`
    try { await navigator.clipboard.writeText(url); message.success('Lien copié') } catch { window.prompt('Copiez le lien:', url) }
  }

  const setRoomPassword = () => {
    if (!apiRef.current) return message.info('Démarrez la réunion d’abord')
    if (!desiredPassword) return message.info('Saisissez un mot de passe')
    try { apiRef.current.executeCommand('password', desiredPassword); message.success('Mot de passe défini (si autorisé)') } catch { message.warning('Mot de passe non disponible sur cette salle') }
  }

  const toggleTileView = () => { if (apiRef.current) apiRef.current.executeCommand('toggleTileView') }
  const toggleScreenShare = () => { if (apiRef.current) apiRef.current.executeCommand('toggleShareScreen') }
  const muteEveryone = () => { if (apiRef.current) apiRef.current.executeCommand('muteEveryone', true) }
  const toggleRaiseHand = () => { if (apiRef.current) { apiRef.current.executeCommand('toggleRaiseHand'); setHandRaised(v=>!v) } }
  const toggleLobby = (checked) => {
    setLobbyEnabled(checked)
    if (!apiRef.current) return message.info('Démarrez la réunion d’abord')
    try { apiRef.current.executeCommand('toggleLobby', checked) } catch { message.info('Le lobby nécessite des droits / configuration serveur') }
  }

  const startRecording = async () => {
    if (!apiRef.current) return message.info('Démarrez la réunion d’abord')
    try {
      await apiRef.current.executeCommand('startRecording', { mode: 'file' })
      message.success('Demande d’enregistrement envoyée (si disponible)')
    } catch { message.info("L’enregistrement n’est pas disponible sur l’instance publique") }
  }
  const stopRecording = async () => {
    if (!apiRef.current) return
    try { await apiRef.current.executeCommand('stopRecording', { mode: 'file' }); message.success('Enregistrement arrêté (si actif)') } catch {}
  }
  const startStreaming = async () => {
    if (!apiRef.current) return message.info('Démarrez la réunion d’abord')
    const key = window.prompt('Clé de stream YouTube (rtmp)')
    if (!key) return
    try { await apiRef.current.executeCommand('startRecording', { mode: 'stream', youtubeStreamKey: key }); message.success('Streaming démarré (si disponible)') } catch { message.info('Streaming indisponible sur cette instance') }
  }
  const stopStreaming = async () => {
    if (!apiRef.current) return
    try { await apiRef.current.executeCommand('stopRecording', { mode: 'stream' }); message.success('Streaming arrêté') } catch {}
  }

  return (
    <Card title="Réunion en ligne" extra={<Space wrap>
      <Button onClick={startMeeting}>Démarrer</Button>
      <Button danger onClick={leaveMeeting}>Quitter</Button>
      <Button onClick={copyInvite}>Copier lien</Button>
    </Space>}>
      <div ref={containerRef} />
      <div style={{ marginTop: 8, color: '#999' }}>Salle: {room}</div>
      <Divider style={{ margin: '12px 0' }} />
      <Space wrap>
        <Input.Password placeholder="Mot de passe de la salle" style={{ width: 220 }} value={desiredPassword} onChange={e=>setDesiredPassword(e.target.value)} />
        <Button onClick={setRoomPassword}>Définir mot de passe</Button>
        <Switch checked={lobbyEnabled} onChange={toggleLobby} />
        <span>Lobby</span>
        <Button onClick={toggleTileView}>Vue en tuiles</Button>
        <Button onClick={toggleScreenShare}>Partager écran</Button>
        <Button onClick={muteEveryone}>Couper micro (tous)</Button>
        <Button onClick={toggleRaiseHand}>{handRaised ? 'Baisser la main' : 'Lever la main'}</Button>
        <Button onClick={startRecording}>Enregistrer</Button>
        <Button onClick={stopRecording}>Arrêter enreg.</Button>
        <Button onClick={startStreaming}>Streamer</Button>
        <Button onClick={stopStreaming}>Arrêter stream</Button>
      </Space>
    </Card>
  )
}

function ParticipantsPanel({ session, onChange }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')

  const add = async () => {
    if (!name) return
    await sessionsAPI.addParticipant(session.id, { name, role, email })
    setName(''); setRole(''); setEmail('')
    onChange()
  }
  const remove = async (pid) => { await sessionsAPI.removeParticipant(session.id, pid); onChange() }
  const toggle = async (pid, present) => { await sessionsAPI.markPresent(session.id, pid, present); onChange() }

  return (
    <Card size="small" title="Participants" extra={<Space>
      <Input placeholder="Nom" value={name} onChange={e=>setName(e.target.value)} />
      <Input placeholder="Rôle" value={role} onChange={e=>setRole(e.target.value)} />
      <Input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <Button onClick={add}>Ajouter</Button>
    </Space>}>
      <List dataSource={session.participants||[]} renderItem={(p)=> (
        <List.Item actions={[<Button key="rm" danger onClick={()=>remove(p.id)}>Supprimer</Button>, <Switch key="pr" checked={!!p.present} onChange={(v)=>toggle(p.id, v)} />]}>
          <List.Item.Meta title={`${p.name} ${p.role?`- ${p.role}`:''}`} description={p.email} />
        </List.Item>
      )} />
    </Card>
  )
}

function AgendaPanel({ session, onChange }) {
  const [title, setTitle] = useState('')
  const [docName, setDocName] = useState('')

  const addItem = async () => { if (!title) return; await sessionsAPI.addAgendaItem(session.id, title); setTitle(''); onChange() }
  const toggle = async (itemId, done) => { await sessionsAPI.toggleAgendaItem(session.id, itemId, done); onChange() }
  const attach = async (itemId) => { if (!docName) return; await sessionsAPI.attachDocument(session.id, itemId, { name: docName }); setDocName(''); onChange() }

  return (
    <Card size="small" title="Ordre du jour" extra={<Space>
      <Input placeholder="Nouvel item" value={title} onChange={e=>setTitle(e.target.value)} />
      <Button onClick={addItem}>Ajouter</Button>
    </Space>}>
      <List dataSource={session.agenda||[]} renderItem={(a)=> (
        <List.Item actions={[<Switch key="dg" checked={!!a.done} onChange={(v)=>toggle(a.id, v)} />]}>
          <List.Item.Meta title={a.title} description={(a.documents||[]).map(d=>d.name).join(', ') || '—'} />
          <Space>
            <Input placeholder="Nom doc" value={docName} onChange={e=>setDocName(e.target.value)} style={{ width: 180 }} />
            <Button onClick={()=>attach(a.id)}>Joindre</Button>
          </Space>
        </List.Item>
      )} />
    </Card>
  )
}

function VotesPanel({ session, onChange }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState('Oui;Non;Abstention')

  const create = async () => { if (!question) return; const opts = options.split(';').map(s=>s.trim()).filter(Boolean); await sessionsAPI.createVote(session.id, question, opts); setQuestion(''); onChange() }
  const vote = async (voteId, optionId) => { await sessionsAPI.castVote(session.id, voteId, optionId); onChange() }
  const close = async (voteId) => { await sessionsAPI.closeVote(session.id, voteId); onChange() }

  return (
    <Card size="small" title="Votes" extra={<Space>
      <Input placeholder="Question" value={question} onChange={e=>setQuestion(e.target.value)} />
      <Input placeholder="Options (séparées par ;)" value={options} onChange={e=>setOptions(e.target.value)} style={{ width: 240 }} />
      <Button onClick={create}>Créer</Button>
    </Space>}>
      <List dataSource={session.votes||[]} renderItem={(v)=> (
        <List.Item actions={[v.open && <Button key="cl" onClick={()=>close(v.id)}>Clore</Button>]}> 
          <List.Item.Meta title={v.question} description={v.open ? 'Ouvert' : 'Fermé'} />
          <Space>
            {(v.options||[]).map(o => (
              <Button key={o.id} onClick={()=>vote(v.id,o.id)} disabled={!v.open}>{o.text} ({o.count||0})</Button>
            ))}
          </Space>
        </List.Item>
      )} />
    </Card>
  )
}

function DeliberationsPanel({ session, onChange }) {
  const [title, setTitle] = useState('')
  const [agendaItemId, setAgendaItemId] = useState(null)
  const [documentName, setDocumentName] = useState('')
  const [decision, setDecision] = useState('Adoptée')
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState(null)

  const resetForm = () => { setTitle(''); setAgendaItemId(null); setDocumentName(''); setDecision('Adoptée'); setText(''); setEditingId(null) }

  const submit = async () => {
    if (!title) return message.info('Titre requis')
    if (editingId) {
      await sessionsAPI.updateDeliberation(session.id, editingId, { title, agendaItemId, documentName, decision, text })
    } else {
      await sessionsAPI.addDeliberation(session.id, { title, agendaItemId, documentName, decision, text })
    }
    resetForm(); onChange()
  }

  const edit = (d) => {
    setEditingId(d.id)
    setTitle(d.title || '')
    setAgendaItemId(d.agendaItemId || null)
    setDocumentName(d.documentName || '')
    setDecision(d.decision || 'Adoptée')
    setText(d.text || '')
  }

  const remove = async (id) => { await sessionsAPI.removeDeliberation(session.id, id); onChange() }
  const sign = async (d) => { await sessionsAPI.updateDeliberation(session.id, d.id, { signature: { name: 'Utilisateur', at: new Date().toISOString(), id: `SIG-D-${d.id}` } }); onChange() }

  const exportPdf = async (d) => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const left = 40, top = 40, maxWidth = 515
    const lines = doc.splitTextToSize(
      `Délibération\nTitre: ${d.title}\nDécision: ${d.decision}\nPoint ODJ: ${(session.agenda||[]).find(a=>String(a.id)===String(d.agendaItemId))?.title || '—'}\nDocument: ${d.documentName||'—'}\n\nTexte:\n${d.text||''}${d.signature?`\n\nSignature: ${d.signature.name} — ${new Date(d.signature.at).toLocaleString('fr-FR')} — ID: ${d.signature.id}`:''}`,
      maxWidth
    )
    doc.setFontSize(12)
    doc.text(lines, left, top)
    doc.save(`Deliberation_${(d.title||'delib').replace(/\s+/g,'_')}.pdf`)
  }

  const exportWord = async (d) => {
    const docx = await import('docx')
    const { Document, Packer, Paragraph } = docx
    const content = `Délibération\nTitre: ${d.title}\nDécision: ${d.decision}\nPoint ODJ: ${(session.agenda||[]).find(a=>String(a.id)===String(d.agendaItemId))?.title || '—'}\nDocument: ${d.documentName||'—'}\n\nTexte:\n${d.text||''}${d.signature?`\n\nSignature: ${d.signature.name} — ${new Date(d.signature.at).toLocaleString('fr-FR')} — ID: ${d.signature.id}`:''}`
    const paragraphs = content.split('\n').map(line => new Paragraph(line))
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] })
    const blob = await Packer.toBlob(doc)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `Deliberation_${(d.title||'delib').replace(/\s+/g,'_')}.docx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Card size="small" title="Délibérations" extra={<Space>
      <Input placeholder="Titre" value={title} onChange={e=>setTitle(e.target.value)} style={{ width: 220 }} />
      <Select
        placeholder="Point ODJ"
        value={agendaItemId}
        onChange={setAgendaItemId}
        style={{ width: 220 }}
        allowClear
        options={(session.agenda||[]).map(a=>({ value: a.id, label: a.title }))}
      />
      <Input placeholder="Document concerné" value={documentName} onChange={e=>setDocumentName(e.target.value)} style={{ width: 220 }} />
      <Select
        value={decision}
        onChange={setDecision}
        style={{ width: 160 }}
        options={[{value:'Adoptée',label:'Adoptée'},{value:'Rejetée',label:'Rejetée'},{value:'Ajournée',label:'Ajournée'}]}
      />
      <Input.TextArea placeholder="Texte de la délibération" value={text} onChange={e=>setText(e.target.value)} style={{ width: 320 }} rows={2} />
      <Button type="primary" onClick={submit}>{editingId ? 'Enregistrer' : 'Ajouter'}</Button>
      {editingId && <Button onClick={resetForm}>Annuler</Button>}
    </Space>}>
      <List
        size="small"
        dataSource={session.deliberations || []}
        locale={{ emptyText: 'Aucune délibération' }}
        renderItem={(d)=> (
          <List.Item
            actions={[
              <Button key="ed" size="small" onClick={()=>edit(d)}>Modifier</Button>,
              <Button key="sg" size="small" onClick={()=>sign(d)}>{d.signature?'Re-signer':'Signer'}</Button>,
              <Button key="rm" size="small" danger onClick={()=>remove(d.id)}>Supprimer</Button>,
              <Button key="pdf" size="small" onClick={()=>exportPdf(d)}>PDF</Button>,
              <Button key="docx" size="small" onClick={()=>exportWord(d)}>Word</Button>,
            ]}
          >
            <List.Item.Meta
              title={<Space>
                <strong>{d.title}</strong>
                <Tag color={d.decision==='Adoptée' ? 'green' : d.decision==='Rejetée' ? 'red' : 'orange'}>{d.decision}</Tag>
                {d.signature && <Tag color="blue">Signé</Tag>}
              </Space>}
              description={
                <>
                  <div>Point ODJ: {(session.agenda||[]).find(a=>String(a.id)===String(d.agendaItemId))?.title || '—'}</div>
                  <div>Document: {d.documentName || '—'}</div>
                </>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  )
}

function MinutesPanel({ session, onChange }) {
  const [content, setContent] = useState(session.minutes?.content || '')
  useEffect(()=>{ setContent(session.minutes?.content || '') }, [session.minutes?.content])
  const generate = async () => { const { data } = await sessionsAPI.generateMinutes(session.id); setContent(data.content); onChange() }
  const save = async () => { const r = await sessionsAPI.saveMinutes(session.id, content); if (!r.success) return message.warning('PV verrouillé'); message.success('PV enregistré'); onChange() }
  const sign = async () => { await sessionsAPI.signMinutes(session.id, 'Utilisateur'); message.success('PV signé'); onChange() }

  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const left = 40, top = 40, maxWidth = 515
    const lines = doc.splitTextToSize(content || '', maxWidth)
    doc.setFontSize(12)
    doc.text(lines, left, top)
    doc.save(`PV_${session.title.replace(/\s+/g,'_')}.pdf`)
  }

  const exportWord = async () => {
    const docx = await import('docx')
    const { Document, Packer, Paragraph } = docx
    const paragraphs = (content || '').split('\n').map(line => new Paragraph(line))
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] })
    const blob = await Packer.toBlob(doc)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `PV_${session.title.replace(/\s+/g,'_')}.docx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Card size="small" title="Procès-verbal">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space wrap>
          <Button onClick={generate}>Générer auto</Button>
          <Button onClick={save} disabled={session.minutes?.locked}>Enregistrer</Button>
          <Button onClick={sign} disabled={session.minutes?.locked}>Signer (démo)</Button>
          <Button onClick={exportPdf}>Exporter PDF</Button>
          <Button onClick={exportWord}>Exporter Word</Button>
          {session.minutes?.locked && <Tag color="default">Verrouillé</Tag>}
        </Space>
        <Input.TextArea rows={6} value={content} onChange={e=>setContent(e.target.value)} disabled={session.minutes?.locked} />
      </Space>
    </Card>
  )
}

function InvitesPanel({ session, onChange }) {
  const [emails, setEmails] = useState('')
  const send = async () => { const list = emails.split(/[;,\s]+/).map(s=>s.trim()).filter(Boolean); await sessionsAPI.sendInvitations(session.id, list); setEmails(''); message.success('Invitations envoyées'); onChange() }
  return (
    <Card size="small" title="Invitations/Rappels" extra={<Space>
      <Input placeholder="emails séparés par ;" value={emails} onChange={e=>setEmails(e.target.value)} style={{ width: 300 }} />
      <Button onClick={send}>Envoyer</Button>
      <Button onClick={async()=>{ await sessionsAPI.sendReminders(session.id); message.success('Rappels envoyés'); }}>Rappels</Button>
    </Space>}>
      <List size="small" dataSource={session.invitations||[]} renderItem={(i)=> (
        <List.Item>
          <List.Item.Meta title={i.email} description={`Envoyé le ${new Date(i.sent_at).toLocaleString('fr-FR')} ${i.accepted?'(Accepté)':''}`} />
        </List.Item>
      )} />
    </Card>
  )
}

function RecordingMeta({ session, onChange }) {
  return (
    <Card size="small" title="Enregistrements (métadonnées)">
      <Space>
        <Button onClick={async()=>{ await sessionsAPI.startRecordingMeta(session.id); onChange() }}>Marquer début</Button>
        <Button onClick={async()=>{ await sessionsAPI.stopRecordingMeta(session.id); onChange() }}>Marquer fin</Button>
      </Space>
      <List size="small" dataSource={session.recordings||[]} renderItem={(r)=> (
        <List.Item>
          <List.Item.Meta title={`Début: ${new Date(r.started_at).toLocaleString('fr-FR')}`} description={r.stopped_at ? `Fin: ${new Date(r.stopped_at).toLocaleString('fr-FR')}` : 'En cours...'} />
        </List.Item>
      )} />
    </Card>
  )
}

function SessionTab({ type, entityId }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await sessionsAPI.list(entityId)
    setSessions(data.filter(s => s.type === type))
    setLoading(false)
  }

  useEffect(()=>{ load() }, [entityId])

  const create = async () => {
    const title = prompt('Titre de la session') || `${type} ${new Date().toLocaleDateString('fr-FR')}`
    await sessionsAPI.create(entityId, { type, title })
    load()
  }
  const start = async (id) => { await sessionsAPI.start(id); load() }
  const end = async (id) => { await sessionsAPI.end(id); load() }
  const post = async (id) => { if (!messageText) return; await sessionsAPI.postMessage(id, 'Vous', messageText); setMessageText(''); load() }

  return (
    <Card title={`Sessions ${type}`} extra={<Button onClick={create}>Nouvelle session</Button>}>
      <List
        loading={loading}
        dataSource={sessions}
        renderItem={(s) => (
          <List.Item actions={[
            s.status!=='live' && s.status!=='ended' ? <Button key="s" onClick={()=>start(s.id)}>Démarrer</Button> : null,
            s.status==='live' ? <Button key="e" danger onClick={()=>end(s.id)}>Clore</Button> : null,
          ]}>
            <List.Item.Meta title={<>{s.title} <Tag color={s.status==='live'?'green':s.status==='ended'?'default':'blue'}>{s.status}</Tag></>} description={`Créée le ${new Date(s.created_at).toLocaleString('fr-FR')}`} />
            <div style={{ width: '100%' }}>
              <Tabs
                size="small"
                items={[
                  { key: 'reunion', label: 'Réunion', children: <JitsiPanel room={s.room || `pr-${entityId}-${s.id}`} /> },
                  { key: 'participants', label: 'Participants', children: <ParticipantsPanel session={s} onChange={load} /> },
                  { key: 'agenda', label: 'Ordre du jour', children: <AgendaPanel session={s} onChange={load} /> },
                  { key: 'votes', label: 'Votes', children: <VotesPanel session={s} onChange={load} /> },
                  { key: 'delibs', label: 'Délibérations', children: <DeliberationsPanel session={s} onChange={load} /> },
                  { key: 'pv', label: 'PV', children: <MinutesPanel session={s} onChange={load} /> },
                  { key: 'invites', label: 'Invitations', children: <InvitesPanel session={s} onChange={load} /> },
                  { key: 'record', label: 'Enregistrements', children: <RecordingMeta session={s} onChange={load} /> },
                ]}
              />
              <Divider />
              <List size="small" header={<strong>Messages</strong>} dataSource={s.messages} renderItem={(m)=> <List.Item>{m.author}: {m.text} <span style={{ color:'#999' }}>({new Date(m.at).toLocaleTimeString('fr-FR')})</span></List.Item>} />
              {s.status==='live' && (
                <Space style={{ marginTop: 8 }}>
                  <Input placeholder="Message" value={messageText} onChange={(e)=>setMessageText(e.target.value)} />
                  <Button onClick={()=>post(s.id)}>Envoyer</Button>
                </Space>
              )}
            </div>
          </List.Item>
        )}
      />
    </Card>
  )
}

function EntitySessions() {
  const { id } = useParams()
  return (
    <Tabs
      items={[
        { key: 'budgetaire', label: 'Session budgétaire', children: <SessionTab type="budgetaire" entityId={id} /> },
        { key: 'comptes', label: "Session d'arrêt des comptes", children: <SessionTab type="comptes" entityId={id} /> },
        { key: 'ag', label: 'Assemblée générale', children: <SessionTab type="ag" entityId={id} /> },
        { key: 'extra', label: 'Sessions extraordinaires', children: <SessionTab type="extra" entityId={id} /> },
      ]}
    />
  )
}

export default EntitySessions