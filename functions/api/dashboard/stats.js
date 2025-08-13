export async function onRequestGet() {
  return new Response(JSON.stringify({ success: true, data: {
    total_reports: 8,
    active_reports: 7,
    executions_today: 12,
    total_executions: 256,
    users_count: 5,
    failed_executions: 1,
  } }), {
    headers: { 'Content-Type': 'application/json' },
  })
}