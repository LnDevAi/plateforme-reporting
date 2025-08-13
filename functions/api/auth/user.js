export async function onRequestGet() {
  const user = { id: 1, name: 'Admin Démo', email: 'demo@plateforme-epe.com', role: 'admin' }
  return new Response(JSON.stringify({ success: true, data: user }), {
    headers: { 'Content-Type': 'application/json' },
  })
}