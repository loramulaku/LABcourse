const request = require('supertest');
const createApp = require('../../src/app');
const store = require('../../src/store/inMemory');

const app = createApp();
const REGISTER = '/api/auth/register';
const LOGIN    = '/api/auth/login';
const PRODUCTS = '/api/shop/products';
const CHECKOUT = '/api/shop/checkout';
const USER     = { name: 'Bob', email: 'bob@test.com', password: 'BobPass123' };

let token;

beforeEach(async () => {
  store.reset();
  await request(app).post(REGISTER).send(USER);
  const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
  token = res.body.token;
});

describe('04 — Product Listing & Checkout', () => {
  it('returns 200 with the full product list without authentication', async () => {
    const res = await request(app).get(PRODUCTS);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns 401 for checkout when no token is provided', async () => {
    const res = await request(app).post(CHECKOUT).send({ productId: 1, quantity: 2 });
    expect(res.status).toBe(401);
  });

  it('returns 201 and the order details on a successful checkout', async () => {
    const res = await request(app)
      .post(CHECKOUT)
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 1, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.productId).toBe(1);
    expect(res.body.quantity).toBe(2);
  });

  it('returns 404 when the productId does not exist', async () => {
    const res = await request(app)
      .post(CHECKOUT)
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 999, quantity: 1 });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 400 when quantity is missing from the checkout body', async () => {
    const res = await request(app)
      .post(CHECKOUT)
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 1 });
    expect(res.status).toBe(400);
  });

  it('calculates the total price correctly (unitPrice × quantity)', async () => {
    const products = (await request(app).get(PRODUCTS)).body;
    const laptop = products.find(p => p.id === 1); // 999.99
    const res = await request(app)
      .post(CHECKOUT)
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 1, quantity: 3 });
    expect(res.status).toBe(201);
    expect(res.body.total).toBeCloseTo(laptop.price * 3, 2);
    expect(res.body.unitPrice).toBe(laptop.price);
  });
});
