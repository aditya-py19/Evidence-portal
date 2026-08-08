

async function testProdLogin() {
  console.log('Testing live production backend endpoint...')
  const url = 'https://evidence-portal-0imv.onrender.com/api/auth/login'

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'test_officer_2026',
        password: 'Password123!',
        rememberMe: true,
        deviceId: 'PROD-TEST-DEVICE',
      }),
    })

    console.log(`HTTP Status: ${res.status} ${res.statusText}`)
    const text = await res.text()
    console.log('Response Body:', text)
  } catch (err: any) {
    console.error('Fetch error:', err)
  }
}

testProdLogin()
