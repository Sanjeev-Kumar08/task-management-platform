import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';
import type { Express } from 'express';

describe('Auth + Workspace + Tasks', () => {
  let app: Express;
  let accessToken = '';
  let workspaceId = '';
  let boardId = '';
  let taskId = '';

  beforeAll(() => {
    app = createApp();
  });

  it('registers a user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Password123!',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
    accessToken = res.body.data.accessToken;
  });

  it('logs in', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'testuser@example.com',
      password: 'Password123!',
    });
    expect(res.status).toBe(200);
    accessToken = res.body.data.accessToken;
  });

  it('returns current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('testuser@example.com');
  });

  it('creates workspace with defaults via transaction', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Workspace', slug: 'test-ws' });
    expect(res.status).toBe(201);
    workspaceId = res.body.data._id;

    const projects = await request(app)
      .get(`/api/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(projects.body.data.length).toBeGreaterThan(0);

    const projectId = projects.body.data[0]._id;
    const boards = await request(app)
      .get(`/api/projects/${projectId}/boards`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(boards.body.data.length).toBeGreaterThan(0);
    boardId = boards.body.data[0]._id;
  });

  it('creates and moves a task', async () => {
    const created = await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Move me', priority: 'HIGH' });
    expect(created.status).toBe(201);
    taskId = created.body.data._id;

    const moved = await request(app)
      .patch(`/api/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'IN_PROGRESS', position: 0, mutationId: 'mut-1' });
    expect(moved.status).toBe(200);
    expect(moved.body.data.status).toBe('IN_PROGRESS');
  });

  it('returns analytics', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/analytics`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalTasks).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.tasksByStatus)).toBe(true);
  });

  it('rejects unauthorized access', async () => {
    const res = await request(app).get('/api/workspaces');
    expect(res.status).toBe(401);
  });
});
