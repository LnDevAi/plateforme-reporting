export async function onRequestPost({ request }) {
  const body = await request.json().catch(()=>({}))
  const user = { id: 1, name: 'Admin Démo', email: body.email || 'demo@plateforme-epe.com', role: 'admin' }
  return new Response(JSON.stringify({ success: true, data: { user, token: 'demo-token' } }), {
    headers: { 'Content-Type': 'application/json' },
  })
}