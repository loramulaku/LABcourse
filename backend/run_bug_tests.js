// Bug test script — runs all 9 remaining bugs and prints results
const http = require('http');

function request(method, path, body, headers) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let body;
        try { body = JSON.parse(raw); } catch { body = raw; }
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Step 1 — get tokens
  const patLogin = await request('POST', '/api/auth/login', { email: 'bugtest_patient@test.com', password: 'BugTest123!' });
  const patToken = patLogin.body.accessToken;

  const docLogin = await request('POST', '/api/auth/login', { email: 'dok1@gmail.com', password: 'doctor123' });
  const docToken = docLogin.body.accessToken;

  console.log('PAT role:', patLogin.body.role, '| DOC role:', docLogin.body.role);

  // BUG-003: Invalid email
  const r003 = await request('POST', '/api/auth/signup', {
    name: 'Test User', email: 'testgmail.com', password: 'test123'
  });
  console.log(`\nBUG-003: HTTP ${r003.status} | ${JSON.stringify(r003.body)}`);

  // BUG-004: Password 5 chars
  const r004 = await request('POST', '/api/auth/signup', {
    name: 'Test', email: `bug004_${Date.now()}@test.com`, password: 'ab123'
  });
  console.log(`BUG-004: HTTP ${r004.status} | ${JSON.stringify(r004.body)}`);

  // BUG-007: Appointment 4min59sec in future (no min-time check on createAppointment)
  const soon = new Date(Date.now() + 4 * 60 * 1000 + 59 * 1000);
  const r007 = await request('POST', '/api/appointments/', {
    doctor_id: 8, scheduled_for: soon.toISOString(), reason: 'BVA test 4min59sec', phone: '044111222'
  }, { Authorization: `Bearer ${patToken}` });
  console.log(`BUG-007: HTTP ${r007.status} | ${JSON.stringify(r007.body)}`);

  // BUG-008: Past datetime
  const r008 = await request('POST', '/api/appointments/', {
    doctor_id: 8, scheduled_for: '2020-01-01T10:00:00Z', reason: 'Past date test', phone: '044111222'
  }, { Authorization: `Bearer ${patToken}` });
  console.log(`BUG-008: HTTP ${r008.status} | ${JSON.stringify(r008.body)}`);

  // BUG-011: 501-char reason (STRING(500) limit)
  const reason501 = 'A'.repeat(501);
  const tomorrow = new Date(Date.now() + 25 * 60 * 60 * 1000);
  const r011 = await request('POST', '/api/appointments/', {
    doctor_id: 8, scheduled_for: tomorrow.toISOString(), reason: reason501, phone: '044111222'
  }, { Authorization: `Bearer ${patToken}` });
  console.log(`BUG-011: HTTP ${r011.status} | ${JSON.stringify(r011.body)}`);

  // BUG-012: Doctor booking (no RBAC on POST /appointments/)
  const tomorrowPlus2h = new Date(Date.now() + 26 * 60 * 60 * 1000);
  const r012 = await request('POST', '/api/appointments/', {
    doctor_id: 8, scheduled_for: tomorrowPlus2h.toISOString(), reason: 'RBAC test doctor booking', phone: '044111222'
  }, { Authorization: `Bearer ${docToken}` });
  console.log(`BUG-012: HTTP ${r012.status} | ${JSON.stringify(r012.body)}`);

  // Need appointment IDs for BUG-013, 014, 015
  // BUG-013: Patient changing status — find any PENDING appointment
  const { Appointment } = require('./models');
  const pending = await Appointment.findOne({ where: { status: 'PENDING' }, attributes: ['id', 'status'] });
  const completed = await Appointment.findOne({ where: { status: 'COMPLETED' }, attributes: ['id', 'status'] });
  const declined = await Appointment.findOne({ where: { status: 'DECLINED' }, attributes: ['id', 'status'] });

  console.log(`\nDB state — PENDING: ${pending?.id}, COMPLETED: ${completed?.id}, DECLINED: ${declined?.id}`);

  // BUG-013
  if (pending) {
    const r013 = await request('PUT', `/api/appointments/${pending.id}`, { status: 'APPROVED' }, { Authorization: `Bearer ${patToken}` });
    console.log(`BUG-013: HTTP ${r013.status} | ${JSON.stringify(r013.body)}`);
  } else {
    // Create one and try
    const newAppt = await Appointment.create({ user_id: 60, doctor_id: 8, scheduled_for: new Date(Date.now() + 48*60*60*1000), reason: 'bug013 test', status: 'PENDING', payment_status: 'unpaid', amount: 20 });
    const r013 = await request('PUT', `/api/appointments/${newAppt.id}`, { status: 'APPROVED' }, { Authorization: `Bearer ${patToken}` });
    console.log(`BUG-013: HTTP ${r013.status} | ${JSON.stringify(r013.body)}`);
  }

  // BUG-014: COMPLETED -> PENDING
  if (completed) {
    const r014 = await request('PUT', `/api/appointments/${completed.id}`, { status: 'PENDING' }, { Authorization: `Bearer ${docToken}` });
    console.log(`BUG-014: HTTP ${r014.status} | ${JSON.stringify(r014.body)}`);
  } else {
    // Create a COMPLETED appointment
    const c = await Appointment.create({ user_id: 60, doctor_id: 8, scheduled_for: new Date(Date.now() + 49*60*60*1000), reason: 'bug014 test', status: 'COMPLETED', payment_status: 'paid', amount: 20 });
    const r014 = await request('PUT', `/api/appointments/${c.id}`, { status: 'PENDING' }, { Authorization: `Bearer ${docToken}` });
    console.log(`BUG-014: HTTP ${r014.status} | ${JSON.stringify(r014.body)}`);
  }

  // BUG-015: DECLINED -> CONFIRMED
  if (declined) {
    const r015 = await request('PUT', `/api/appointments/${declined.id}`, { status: 'CONFIRMED' }, { Authorization: `Bearer ${docToken}` });
    console.log(`BUG-015: HTTP ${r015.status} | ${JSON.stringify(r015.body)}`);
  } else {
    const d = await Appointment.create({ user_id: 60, doctor_id: 8, scheduled_for: new Date(Date.now() + 50*60*60*1000), reason: 'bug015 test', status: 'DECLINED', payment_status: 'unpaid', amount: 20 });
    const r015 = await request('PUT', `/api/appointments/${d.id}`, { status: 'CONFIRMED' }, { Authorization: `Bearer ${docToken}` });
    console.log(`BUG-015: HTTP ${r015.status} | ${JSON.stringify(r015.body)}`);
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
