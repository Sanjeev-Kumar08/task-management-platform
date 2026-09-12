import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';
import type { Express } from 'express';
import { User } from '../src/modules/users/user.model.js';
import bcrypt from 'bcrypt';

describe('RBAC', () => {
  let app: Express;
  let ownerToken = '';
  let viewerToken = '';
  let workspaceId = '';

  beforeAll(async () => {
    app = createApp();

    const ownerReg = await request(app).post('/api/auth/register').send({
      name: 'Owner',
      email: 'owner-rbac@example.com',
      password: 'Password123!',
    });
    ownerToken = ownerReg.body.data.accessToken;

    const passwordHash = await bcrypt.hash('Password123!', 10);
    await User.create({
      name: 'Viewer',
      email: 'viewer-rbac@example.com',
      passwordHash,
    });

    const viewerLogin = await request(app).post('/api/auth/login').send({
      email: 'viewer-rbac@example.com',
      password: 'Password123!',
    });
    viewerToken = viewerLogin.body.data.accessToken;

    const ws = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'RBAC WS', slug: 'rbac-ws' });
    workspaceId = ws.body.data._id;

    await request(app)
      .post(`/api/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'viewer-rbac@example.com', role: 'VIEWER' });
  }, 120_000);

  it('allows viewer to read workspace', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
  });

  it('blocks viewer from creating projects', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Should Fail' });
    expect(res.status).toBe(403);
  });
});
