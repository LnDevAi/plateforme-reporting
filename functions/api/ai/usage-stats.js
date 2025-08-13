export async function onRequestGet() {
  const data = {
    available: true,
    usage: 2,
    limit: 100,
  }
  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    status: 200,
  })
}