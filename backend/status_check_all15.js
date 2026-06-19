// Full status check for all 15 bugs
const http = require('http');
const fs = require('fs');
const path = require('path');

function req(method, urlPath, body, headers = {}) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5000, path: urlPath, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    };
    const r = http.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        let parsed; try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    r.on('error', e => resolve({ status: 0, body: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function multipartReq(urlPath, filePath, mimeType, authToken) {
  return new Promise((resolve) => {
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const filename = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="result_pdf"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileContent, footer]);
    const opts = {
      hostname: 'localhost', port: 5000, path: urlPath, method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        Authorization: `Bearer ${authToken}`,
      },
    };
    const r = http.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        let parsed; try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    r.on('error', e => resolve({ status: 0, body: e.message }));
    r.write(body);
    r.end();
  });
}

async function main() {
  // ── tokens ──────────────────────────────────────────────────────────────
  const patLogin = await req('POST', '/api/auth/login', { email: 'bugtest_patient@test.com', password: 'BugTest123!' });
  const patToken = patLogin.body.accessToken;

  const docLogin = await req('POST', '/api/auth/login', { email: 'dok1@gmail.com', password: 'doctor123' });
  const docToken = docLogin.body.accessToken;

  const labLogin = await req('POST', '/api/auth/login', { email: 'lab1@gmail.com', password: 'lab123' });
  const labToken = labLogin.body.accessToken;

  console.log(`Tokens — patient:${patLogin.body.role} doc:${docLogin.body.role} lab:${labLogin.body.role}\n`);

  const results = {};

  // ── BUG-001 ─────────────────────────────────────────────────────────────
  const r1 = await req('POST', '/api/laboratories/request-analysis',
    { laboratory_id: 1, analysis_type_id: 1, appointment_date: '2026-07-01', time: '09:00', notes: 'bug test' },
    { Authorization: `Bearer ${patToken}` });
  results['BUG-001'] = { status: r1.status, body: r1.body };

  // ── BUG-002 ─────────────────────────────────────────────────────────────
  const r2 = await req('POST', '/api/ipd/doctor/admission-request',
    { patient_id: 6, diagnosis: 'Bug002 test', treatment_plan: 'Test plan', urgency: 'Normal', recommended_ward_id: 1, recommended_room_type: 'General' },
    { Authorization: `Bearer ${docToken}` });
  results['BUG-002'] = { status: r2.status, body: r2.body };

  // ── BUG-003 ─────────────────────────────────────────────────────────────
  const r3 = await req('POST', '/api/auth/signup',
    { name: 'Test User', email: 'testgmail.com', password: 'test123' });
  results['BUG-003'] = { status: r3.status, body: r3.body };

  // ── BUG-004 ─────────────────────────────────────────────────────────────
  const r4 = await req('POST', '/api/auth/signup',
    { name: 'Test', email: `bug004check_${Date.now()}@test.com`, password: 'ab123' });
  results['BUG-004'] = { status: r4.status, body: r4.body };

  // ── BUG-005 ─────────────────────────────────────────────────────────────
  // Doctor 3 has available=false
  const r5 = await req('POST', '/api/appointments/',
    { doctor_id: 3, scheduled_for: '2026-07-20T10:00:00Z', reason: 'BUG-005 test', phone: '044111222' },
    { Authorization: `Bearer ${patToken}` });
  results['BUG-005'] = { status: r5.status, body: r5.body };

  // ── BUG-006 ─────────────────────────────────────────────────────────────
  // Create a tiny fake JPG file
  const tmpDir = require('os').tmpdir();
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const jpgPath = path.join(tmpDir, 'test_bug006.jpg');
  fs.writeFileSync(jpgPath, Buffer.from('FFD8FFE000104A46494600', 'hex')); // minimal JPEG header
  const r6 = await multipartReq('/api/laboratories/dashboard/upload-result/1', jpgPath, 'image/jpeg', labToken);
  results['BUG-006'] = { status: r6.status, body: r6.body };

  // ── BUG-007 ─────────────────────────────────────────────────────────────
  const soon = new Date(Date.now() + 4 * 60 * 1000 + 59 * 1000).toISOString();
  const r7 = await req('POST', '/api/appointments/',
    { doctor_id: 1, scheduled_for: soon, reason: 'BUG-007 4min59sec test', phone: '044111222' },
    { Authorization: `Bearer ${patToken}` });
  results['BUG-007'] = { status: r7.status, body: r7.body };

  // ── BUG-008 ─────────────────────────────────────────────────────────────
  const r8 = await req('POST', '/api/appointments/',
    { doctor_id: 1, scheduled_for: '2020-01-01T10:00:00Z', reason: 'BUG-008 past date', phone: '044111222' },
    { Authorization: `Bearer ${patToken}` });
  results['BUG-008'] = { status: r8.status, body: r8.body };

  // ── BUG-009 ─────────────────────────────────────────────────────────────
  const pdf10mb = path.join(tmpDir, 'exact10mb_check.pdf');
  const pdfHeader = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n');
  const pdfFooter = Buffer.from('\n%%EOF\n');
  const target10 = 10 * 1024 * 1024;
  const pad10 = Buffer.alloc(target10 - pdfHeader.length - pdfFooter.length, 37);
  fs.writeFileSync(pdf10mb, Buffer.concat([pdfHeader, pad10, pdfFooter]));
  const r9 = await multipartReq('/api/laboratories/dashboard/upload-result/1', pdf10mb, 'application/pdf', labToken);
  results['BUG-009'] = { status: r9.status, body: r9.body };

  // ── BUG-010 ─────────────────────────────────────────────────────────────
  const pdf105mb = path.join(tmpDir, 'over10mb_check.pdf');
  const target105 = 10 * 1024 * 1024 + 524288; // 10.5 MB
  const pad105 = Buffer.alloc(target105 - pdfHeader.length - pdfFooter.length, 37);
  fs.writeFileSync(pdf105mb, Buffer.concat([pdfHeader, pad105, pdfFooter]));
  const r10 = await multipartReq('/api/laboratories/dashboard/upload-result/1', pdf105mb, 'application/pdf', labToken);
  results['BUG-010'] = { status: r10.status, body: r10.body };

  // ── BUG-011 ─────────────────────────────────────────────────────────────
  const tomorrow = new Date(Date.now() + 25 * 3600 * 1000).toISOString();
  const r11 = await req('POST', '/api/appointments/',
    { doctor_id: 1, scheduled_for: tomorrow, reason: 'A'.repeat(501), phone: '044111222' },
    { Authorization: `Bearer ${patToken}` });
  results['BUG-011'] = { status: r11.status, body: r11.body };

  // ── BUG-012 ─────────────────────────────────────────────────────────────
  const tom2h = new Date(Date.now() + 26 * 3600 * 1000).toISOString();
  const r12 = await req('POST', '/api/appointments/',
    { doctor_id: 1, scheduled_for: tom2h, reason: 'BUG-012 doctor booking', phone: '044111222' },
    { Authorization: `Bearer ${docToken}` });
  results['BUG-012'] = { status: r12.status, body: r12.body };

  // ── BUG-013 ─────────────────────────────────────────────────────────────
  // Find or create a PENDING appointment
  const { Appointment } = require('./models');
  let pendingAppt = await Appointment.findOne({ where: { status: 'PENDING' }, attributes: ['id'] });
  if (!pendingAppt) {
    pendingAppt = await Appointment.create({
      user_id: 60, doctor_id: 8,
      scheduled_for: new Date(Date.now() + 48 * 3600 * 1000),
      reason: 'Bug013 seed', status: 'PENDING', payment_status: 'unpaid', amount: 20
    });
  }
  const r13 = await req('PUT', `/api/appointments/${pendingAppt.id}`,
    { status: 'APPROVED' },
    { Authorization: `Bearer ${patToken}` });
  results['BUG-013'] = { status: r13.status, body: r13.body };

  // ── BUG-014 ─────────────────────────────────────────────────────────────
  let completedAppt = await Appointment.findOne({ where: { status: 'COMPLETED' }, attributes: ['id'] });
  if (!completedAppt) {
    completedAppt = await Appointment.create({
      user_id: 60, doctor_id: 8,
      scheduled_for: new Date(Date.now() + 49 * 3600 * 1000),
      reason: 'Bug014 seed', status: 'COMPLETED', payment_status: 'paid', amount: 20
    });
  }
  const r14 = await req('PUT', `/api/appointments/${completedAppt.id}`,
    { status: 'PENDING' },
    { Authorization: `Bearer ${docToken}` });
  results['BUG-014'] = { status: r14.status, body: r14.body };

  // ── BUG-015 ─────────────────────────────────────────────────────────────
  let declinedAppt = await Appointment.findOne({ where: { status: 'DECLINED' }, attributes: ['id'] });
  if (!declinedAppt) {
    declinedAppt = await Appointment.create({
      user_id: 60, doctor_id: 8,
      scheduled_for: new Date(Date.now() + 50 * 3600 * 1000),
      reason: 'Bug015 seed', status: 'DECLINED', payment_status: 'unpaid', amount: 20
    });
  }
  const r15 = await req('PUT', `/api/appointments/${declinedAppt.id}`,
    { status: 'CONFIRMED' },
    { Authorization: `Bearer ${docToken}` });
  results['BUG-015'] = { status: r15.status, body: r15.body };

  // ── Print results ────────────────────────────────────────────────────────
  console.log('\n===== FULL STATUS CHECK =====\n');
  for (const [bug, { status, body }] of Object.entries(results)) {
    console.log(`${bug}: HTTP ${status} | ${JSON.stringify(body)}`);
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
