const request = require('supertest');
const createApp = require('../../src/app');
const store = require('../../src/store/inMemory');

const app = createApp();
const REGISTER = '/api/auth/register';
const LOGIN    = '/api/auth/login';
const LOGOUT   = '/api/auth/logout';
const PRODUCTS = '/api/shop/products';
const CHECKOUT = '/api/shop/checkout';
const USER     = { name: 'Carol', email: 'carol@test.com', password: 'CarolPass123' };

async function loginUser() {
  const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
  return res.body.token;
}

beforeEach(async () => {
  store.reset();
  await request(app).post(REGISTER).send(USER);
});

describe('05 — Logout', () => {
  it('returns 200 when logging out with a valid token', async () => {
    const token = await loginUser();
    const res = await request(app).post(LOGOUT).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).post(LOGOUT);
    expect(res.status).toBe(401);
  });

  it('returns 401 when the token is invalid (random string)', async () => {
    const res = await request(app).post(LOGOUT).set('Authorization', 'Bearer totally.fake.token');
    expect(res.status).toBe(401);
  });

  it('rejects a protected route (checkout) after logout — token is invalidated', async () => {
    const token = await loginUser();
    await request(app).post(LOGOUT).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post(CHECKOUT)
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 1, quantity: 1 });
    expect(res.status).toBe(401);
  });

  it('allows the user to login again and get a new valid token after logout', async () => {
    const oldToken = await loginUser();
    await request(app).post(LOGOUT).set('Authorization', `Bearer ${oldToken}`);

    const newToken = await loginUser();
    expect(newToken).toBeDefined();
    expect(newToken).not.toBe(oldToken);

    const res = await request(app)
      .post(CHECKOUT)
      .set('Authorization', `Bearer ${newToken}`)
      .send({ productId: 2, quantity: 1 });
    expect(res.status).toBe(201);
  });

  it('returns 401 on a second logout attempt with the same token', async () => {
    const token = await loginUser();
    await request(app).post(LOGOUT).set('Authorization', `Bearer ${token}`);
    const res = await request(app).post(LOGOUT).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
