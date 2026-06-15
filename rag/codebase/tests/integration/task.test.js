const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User, Task } = require('../../src/models');

describe('Task Endpoints', () => {
  let token1, token2;
  let user1, user2;

  beforeEach(async () => {
    // Clear tables
    await Task.destroy({ where: {}, truncate: { cascade: true } });
    await User.destroy({ where: {}, truncate: { cascade: true } });

    // Create User 1
    user1 = await User.create({
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123',
    });

    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user1@example.com', password: 'password123' });
    token1 = loginRes1.body.token;

    // Create User 2
    user2 = await User.create({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
    });

    const loginRes2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user2@example.com', password: 'password123' });
    token2 = loginRes2.body.token;
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a task successfully when authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Buy Groceries',
          description: 'Milk, bread, and fruits',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.task).toHaveProperty('title', 'Buy Groceries');
      expect(res.body.data.task).toHaveProperty('userId', user1.id);
    });

    it('should fail task creation without a title', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'No title provided',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeEach(async () => {
      // Create some tasks for User 1
      await Task.create({ title: 'Task 1', completed: false, userId: user1.id });
      await Task.create({ title: 'Task 2', completed: true, userId: user1.id });
      // Create a task for User 2
      await Task.create({ title: 'Task 3', completed: false, userId: user2.id });
    });

    it('should fetch only tasks belonging to authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.results).toBe(2);
      expect(res.body.data.tasks[0].userId).toBe(user1.id);
      expect(res.body.data.tasks[1].userId).toBe(user1.id);
    });

    it('should filter tasks by completed status', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?completed=true')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.results).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('Task 2');
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    let task1;

    beforeEach(async () => {
      task1 = await Task.create({
        title: 'User 1 Task',
        userId: user1.id,
      });
    });

    it('should fetch an owned task by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.task.title).toBe('User 1 Task');
    });

    it('should return 404 when user tries to fetch someone else\'s task', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    let task1;

    beforeEach(async () => {
      task1 = await Task.create({
        title: 'Original Title',
        userId: user1.id,
      });
    });

    it('should update owned task details', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Updated Title',
          completed: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.task.title).toBe('Updated Title');
      expect(res.body.data.task.completed).toBe(true);
    });

    it('should block updates to non-owned tasks', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Hacked Title',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    let task1;

    beforeEach(async () => {
      task1 = await Task.create({
        title: 'To Be Deleted',
        userId: user1.id,
      });
    });

    it('should delete an owned task successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(204);

      // Verify DB
      const dbTask = await Task.findByPk(task1.id);
      expect(dbTask).toBeNull();
    });

    it('should deny deletion of non-owned tasks', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });
  });
});
