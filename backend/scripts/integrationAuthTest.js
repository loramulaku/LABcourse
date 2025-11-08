const fetch = global.fetch || require('node-fetch');
const BASE = 'http://localhost:5000';

async function main() {
  try {
    console.log('1) Logging in as seeded admin to capture refresh cookie...');
    const loginResp = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'seed.admin@example.local', password: 'AdminPass123!' }),
    });

    const loginBody = await loginResp.json().catch(() => null);
    console.log('Login status:', loginResp.status);
    console.log('Login body preview:', loginBody && { message: loginBody.message, userId: loginBody.userId });

    if (!loginResp.ok) {
      console.error('Login failed, aborting');
      process.exit(2);
    }

    // Collect Set-Cookie header(s)
    const rawSetCookie = loginResp.headers.raw ? loginResp.headers.raw()['set-cookie'] : loginResp.headers.get('set-cookie') || [];
    const setCookieArr = Array.isArray(rawSetCookie) ? rawSetCookie : (rawSetCookie ? [rawSetCookie] : []);
    if (setCookieArr.length === 0) {
      console.warn('No Set-Cookie header received from login; refresh endpoint test may fail (depends on how server sets cookie).');
    } else {
      console.log('Received Set-Cookie headers:', setCookieArr.map(s => s.split(';')[0]));
    }

    // Build Cookie header to send back
    const cookieHeader = setCookieArr.map(s => s.split(';')[0]).join('; ');

    console.log('\n2) Calling protected GET /api/billing/bills using access token from login...');
    const accessToken = loginBody?.accessToken;
    const billsResp = await fetch(`${BASE}/api/billing/bills`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('Bills status:', billsResp.status);
    const billsBody = await billsResp.json().catch(() => null);
    console.log('Bills count (if any):', billsBody && billsBody.bills ? billsBody.bills.length : 'n/a');

    console.log('\n3) Calling POST /api/auth/refresh with Cookie header to validate refresh flow...');
    const refreshResp = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: cookieHeader ? { Cookie: cookieHeader } : {}
    });
    console.log('Refresh status:', refreshResp.status);
    const refreshBody = await refreshResp.json().catch(() => null);
    console.log('Refresh response preview:', refreshBody && { accessToken: !!refreshBody.accessToken, message: refreshBody.message });

    if (refreshResp.ok && refreshBody && refreshBody.accessToken) {
      console.log('\n✅ Refresh succeeded and returned an accessToken. Auth flow preserved.');
      process.exit(0);
    }

    console.error('\n❌ Refresh did not return an accessToken. This may be expected if the server sets the refresh token with SameSite or Secure flags and your client disconnects; check server logs.');
    process.exit(3);
  } catch (err) {
    console.error('Integration test failed:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
