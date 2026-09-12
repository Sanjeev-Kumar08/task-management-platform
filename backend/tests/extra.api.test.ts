import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';
import type { Express } from 'express';

describe('Comments, notifications, search, refresh', () => {
  let app: Express;
  let accessToken = '';
  let refreshCookie = '';
  let workspaceId = '';
  let boardId = '';
  let taskId = '';

  beforeAll(async () => {
    app = createApp();
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Extra User',
      email: 'extra@example.com',
      password: 'Password123!',
    });
    accessToken = reg.body.data.accessToken;
    const raw = reg.headers['set-cookie'];
    refreshCookie = Array.isArray(raw) ? raw[0] : (raw ?? '');

    const ws = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Extra WS', slug: 'extra-ws' });
    workspaceId = ws.body.data._id;

    const projects = await request(app)
      .get(`/api/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${accessToken}`);
    const projectId = projects.body.data[0]._id;
    const boards = await request(app)
      .get(`/api/projects/${projectId}/boards`)
      .set('Authorization', `Bearer ${accessToken}`);
    boardId = boards.body.data[0]._id;

    const task = await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Searchable rocket task', description: 'rocket payload' });
    taskId = task.body.data._id;
  }, 120_000);

  it('refreshes access token', async () => {
    const res = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    accessToken = res.body.data.accessToken;
  });

  it('creates and lists comments', async () => {
    const created = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'Looks good' });
    expect(created.status).toBe(201);

    const list = await request(app)
      .get(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(list.body.data.length).toBeGreaterThan(0);
  });

  it('lists notifications and marks read', async () => {
    const list = await request(app)
      .get('/api/notifications?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveProperty('items');

    await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('searches tasks', async () => {
    const res = await request(app)
      .get('/api/search')
      .query({ q: 'rocket', workspaceId })
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('tasks');
  });

  it('lists channels and posts a message', async () => {
    const channels = await request(app)
      .get(`/api/workspaces/${workspaceId}/channels`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(channels.status).toBe(200);
    expect(channels.body.data.length).toBeGreaterThan(0);
    const channelId = channels.body.data[0]._id;

    const msg = await request(app)
      .post(`/api/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'Hello channel' });
    expect(msg.status).toBe(201);

    const list = await request(app)
      .get(`/api/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(list.body.data.length).toBeGreaterThan(0);
  });

  it('updates profile and logs out', async () => {
    const profile = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Extra User Updated' });
    expect(profile.status).toBe(200);

    const logout = await request(app).post('/api/auth/logout').set('Cookie', refreshCookie);
    expect(logout.status).toBe(200);
  });
});
