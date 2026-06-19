const request = require('supertest');
const createApp = require('../../src/app');
const store = require('../../src/store/inMemory');

const app = createApp();
const REGISTER = '/api/auth/register';
const LOGIN    = '/api/auth/login';
const USER     = { name: 'Alice', email: 'alice@test.com', password: 'secret123' };

beforeEach(async () => {
  store.reset();
  await request(app).post(REGISTER).send(USER); // seed one user
});

describe('02 — Login', () => {
  it('returns 200 with a JWT token and user data on valid credentials', async () => {
    const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({ email: USER.email, role: 'user' });
  });

  it('returns 401 when the password is wrong', async () => {
    const res = await request(app).post(LOGIN).send({ email: USER.email, password: 'WrongPassword123!' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('returns 401 when the email does not exist', async () => {
    const res = await request(app).post(LOGIN).send({ email: 'nobody@test.com', password: 'secret123' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when email is missing from the request body', async () => {
    const res = await request(app).post(LOGIN).send({ password: 'secret123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when password is missing from the request body', async () => {
    const res = await request(app).post(LOGIN).send({ email: USER.email });
    expect(res.status).toBe(400);
  });

  it('response user object contains id, name, email, and role', async () => {
    const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
    expect(res.status).toBe(200);
    const { user } = res.body;
    expect(user.id).toBeDefined();
    expect(user.name).toBe(USER.name);
    expect(user.email).toBe(USER.email);
    expect(user.role).toBe('user');
    expect(user.passwordHash).toBeUndefined();
  });
});
