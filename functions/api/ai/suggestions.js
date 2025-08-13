export async function onRequestGet(context) {
  const url = new URL(context.request.url)
  const mode = url.searchParams.get('mode') || 'reports'

  const help = [
    { text: 'Comment créer une session ?', category: 'help' },
    { text: 'Où trouver les rapports (Élaboration/Exécution) ?', category: 'help' },
    { text: 'Comment exporter un PV en PDF ?', category: 'help' },
  ]
  const reports = [
    { text: 'Résume ce rapport en 5 bullet points', category: 'reports' },
    { text: 'Liste des risques et recommandations', category: 'reports' },
    { text: 'Vérifie la cohérence des chiffres budgetaires', category: 'reports' },
  ]

  return new Response(JSON.stringify({ suggestions: mode === 'help' ? help : reports }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    status: 200,
  })
}