const request = require('supertest');
const createApp = require('../../src/app');
const store = require('../../src/store/inMemory');

const app = createApp();
const REGISTER = '/api/auth/register';
const LOGIN    = '/api/auth/login';
const FORGOT   = '/api/auth/forgot-password';
const RESET    = '/api/auth/reset-password';
const USER     = { name: 'Alice', email: 'alice@test.com', password: 'OldPass123' };

beforeEach(async () => {
  store.reset();
  await request(app).post(REGISTER).send(USER);
});

describe('03 — Password Reset Flow', () => {
  it('returns 200 for forgot-password with a registered email and provides a reset token', async () => {
    const res = await request(app).post(FORGOT).send({ email: USER.email });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/instructions sent/i);
    expect(res.body.resetToken).toBeDefined(); // exposed for test env
  });

  it('returns 200 for forgot-password with an unknown email (security: no disclosure)', async () => {
    const res = await request(app).post(FORGOT).send({ email: 'ghost@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/instructions sent/i);
    expect(res.body.resetToken).toBeUndefined(); // no token for unknown emails
  });

  it('returns 400 when email is missing from forgot-password request', async () => {
    const res = await request(app).post(FORGOT).send({});
    expect(res.status).toBe(400);
  });

  it('resets the password successfully with a valid token', async () => {
    const forgot = await request(app).post(FORGOT).send({ email: USER.email });
    const res = await request(app).post(RESET).send({
      token: forgot.body.resetToken,
      newPassword: 'NewPass456',
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset successfully/i);
  });

  it('returns 400 for reset-password with an invalid token', async () => {
    const res = await request(app).post(RESET).send({ token: 'fake-token-xyz', newPassword: 'NewPass456' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('allows login with the new password after a successful reset', async () => {
    const forgot = await request(app).post(FORGOT).send({ email: USER.email });
    await request(app).post(RESET).send({ token: forgot.body.resetToken, newPassword: 'NewPass456' });

    const oldLogin = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
    expect(oldLogin.status).toBe(401); // old password rejected

    const newLogin = await request(app).post(LOGIN).send({ email: USER.email, password: 'NewPass456' });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.token).toBeDefined();
  });
});
