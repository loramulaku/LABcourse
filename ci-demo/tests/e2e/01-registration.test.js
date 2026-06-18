const request = require('supertest');
const createApp = require('../../src/app');
const store = require('../../src/store/inMemory');

const app = createApp();
const ENDPOINT = '/api/auth/register';
const VALID = { name: 'Alice', email: 'alice@test.com', password: 'secret123' };

beforeEach(() => store.reset());

describe('01 — User Registration', () => {
  it('registers a new user and returns 201 with user data (no password)', async () => {
    const res = await request(app).post(ENDPOINT).send(VALID);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Alice', email: 'alice@test.com', role: 'user' });
    expect(res.body.id).toBeDefined();
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post(ENDPOINT).send({ name: 'Bob', password: 'secret123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post(ENDPOINT).send({ name: 'Bob', email: 'bob@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 409 when the email is already registered', async () => {
    await request(app).post(ENDPOINT).send(VALID);
    const res = await request(app).post(ENDPOINT).send({ ...VALID, name: 'Alice2' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('returns 400 for an invalid email format', async () => {
    const res = await request(app).post(ENDPOINT).send({ name: 'Bob', email: 'not-an-email', password: 'secret123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is shorter than 6 characters', async () => {
    const res = await request(app).post(ENDPOINT).send({ name: 'Bob', email: 'bob@test.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 characters/i);
  });
});
