const fetch = global.fetch || require('node-fetch');
const BASE = 'http://localhost:5000';

async function main() {
  try {
    console.log('1) Login as seeded admin (will use admin to call admin-only billing endpoints)...');
    const loginResp = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'seed.admin@example.local', password: 'AdminPass123!' })
    });

    const loginBody = await loginResp.json().catch(() => null);
    console.log('Login status:', loginResp.status);
    console.log('Login body:', loginBody);

    if (!loginResp.ok) {
      console.error('Login failed, aborting smoke test.');
      process.exit(2);
    }

    const accessToken = loginBody?.accessToken;
    if (!accessToken) {
      console.error('No accessToken returned by login');
      process.exit(3);
    }

    console.log('\n2) Call protected GET /api/billing/bills with access token...');
    const billsResp = await fetch(`${BASE}/api/billing/bills`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const billsBody = await billsResp.json().catch(() => null);
    console.log('Bills status:', billsResp.status);
    console.log('Bills body:', billsBody);

    // Try refresh endpoint to validate cookie-based refresh (we can't read httpOnly cookie here, but endpoint should succeed if cookie present)
    console.log('\n3) Attempting refresh (note: this test cannot provide httpOnly cookie, so success depends on environment)');
    const refreshResp = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
    console.log('Refresh status:', refreshResp.status);
    const refreshBody = await refreshResp.json().catch(() => null);
    console.log('Refresh body:', refreshBody);

    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
