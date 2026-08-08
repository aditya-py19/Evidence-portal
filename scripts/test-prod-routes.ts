async function testProdRoutes() {
  console.log('Testing production endpoints...')

  const routes = [
    { url: 'https://evidence-portal-0imv.onrender.com/api/health', method: 'GET' },
    { url: 'https://evidence-portal-0imv.onrender.com/api/auth/login', method: 'POST', body: { identifier: 'test_officer_2026', password: 'Password123!' } },
    { url: 'https://evidence-portal-0imv.onrender.com/api/cases/assigned', method: 'GET' },
  ]

  for (const r of routes) {
    try {
      const res = await fetch(r.url, {
        method: r.method,
        headers: { 'Content-Type': 'application/json' },
        body: r.body ? JSON.stringify(r.body) : undefined,
      })
      console.log(`[${r.method}] ${r.url} -> Status: ${res.status} ${res.statusText}`)
      const text = await res.text()
      console.log('Response:', text.substring(0, 300))
    } catch (e: any) {
      console.error(`[ERR] ${r.url}:`, e.message)
    }
  }
}

testProdRoutes()
