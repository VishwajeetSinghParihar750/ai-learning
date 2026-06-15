const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User } = require('../../src/models');

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    // Clear user table before each test to maintain isolation
    await User.destroy({ where: {}, truncate: { cascade: true } });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully and return a token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('name', 'John Doe');
      expect(res.body.data.user).toHaveProperty('email', 'john@example.com');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should fail registration with an invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          email: 'notanemail',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body.message).toContain('valid email');
    });

    it('should fail when email is already registered', async () => {
      // Create existing user first
      await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Clone',
          email: 'jane@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login User',
        email: 'login@example.com',
        password: 'password123',
      });
    });

    it('should log in successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('login@example.com');
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Incorrect email or password');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'Profile User',
        email: 'profile@example.com',
        password: 'password123',
      });

      // Login to get token
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'profile@example.com',
          password: 'password123',
        });
      token = res.body.token;
    });

    it('should return user profile with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('profile@example.com');
    });

    it('should fail profile access without authorization header', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('not logged in');
    });
  });
});
