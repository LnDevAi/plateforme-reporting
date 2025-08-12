export async function onRequestPost(context) {
  const { request } = context
  const body = await request.json().catch(()=>({}))
  const mode = body.mode || 'reports'

  // Simple mock responses per mode
  let message = ''
  let suggestions = []
  if (mode === 'help') {
    message = `Voici comment utiliser la plateforme:
- Navigation: menu à gauche (Tableau de bord, Rapports, Entités, Sessions, etc.)
- Sessions: ouvrez Entités > Sessions, créez une session puis utilisez les onglets (Réunion, Participants, Ordre du jour, Votes, PV, Invitations)
- Documents: Rapports > Élaboration/Exécution pour créer/éditer budget, programme, PPM, etc.`
    suggestions = [
      'Comment créer une session et démarrer la réunion ?',
      'Où générer et exporter le PV ?',
      'Comment ajouter un vote et voir les résultats ?'
    ]
  } else {
    message = `Je peux vous aider à lire, structurer et analyser vos rapports (budget, PPM, activités, etc.). Indiquez le type de document, le contexte et votre besoin (résumé, contrôle de cohérence, indicateurs, etc.).`
    suggestions = [
      'Résume le rapport d’activités en 5 points',
      'Analyse des écarts budget (prévu vs réalisé)',
      'Propose des indicateurs SMART pour le programme'
    ]
  }

  const response = {
    success: true,
    message,
    suggestions,
    provider: 'mock',
    tokens_used: 0,
    conversation_id: Date.now().toString(),
  }

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    status: 200,
  })
}