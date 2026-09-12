import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

async function register(name: string, email: string) {
  const res = await request(app).post('/api/auth/register').send({
    name,
    email,
    password: 'Password123!',
  });
  expect(res.status).toBe(201);
  return {
    token: res.body.data.accessToken as string,
    user: res.body.data.user,
  };
}

describe('SaaS lifecycle', () => {
  it('creates workspace, invites, accepts, changes role, transfers ownership', async () => {
    const owner = await register('Owner One', `owner_${Date.now()}@test.com`);
    const invitee = await register('Invitee Two', `invitee_${Date.now()}@test.com`);

    const ws = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Alpha Team', description: 'First workspace' });
    expect(ws.status).toBe(201);
    const workspaceId = ws.body.data._id || ws.body.data.id;

    const invite = await request(app)
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: invitee.user.email, role: 'MEMBER' });
    expect(invite.status).toBe(201);
    expect(invite.body.data.inviteUrl).toBeTruthy();
    const token = String(invite.body.data.inviteUrl).split('/invite/')[1];

    const preview = await request(app).get(`/api/invitations/${token}`);
    expect(preview.status).toBe(200);
    expect(preview.body.data.email).toBe(invitee.user.email);

    const accept = await request(app)
      .post(`/api/invitations/${token}/accept`)
      .set('Authorization', `Bearer ${invitee.token}`);
    expect(accept.status).toBe(200);

    const list = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${invitee.token}`);
    expect(
      list.body.data.some(
        (w: { _id?: string; id?: string }) => String(w._id || w.id) === String(workspaceId),
      ),
    ).toBe(true);

    const roleChange = await request(app)
      .patch(`/api/workspaces/${workspaceId}/members/${invitee.user.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ role: 'ADMIN' });
    expect(roleChange.status).toBe(200);

    const transfer = await request(app)
      .post(`/api/workspaces/${workspaceId}/transfer-ownership`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ newOwnerId: invitee.user.id });
    expect(transfer.status).toBe(200);

    const leaveBlocked = await request(app)
      .post(`/api/workspaces/${workspaceId}/leave`)
      .set('Authorization', `Bearer ${invitee.token}`);
    expect(leaveBlocked.status).toBe(403);
  });

  it('enforces workspace isolation', async () => {
    const a = await register('User A', `a_${Date.now()}@test.com`);
    const b = await register('User B', `b_${Date.now()}@test.com`);

    const ws = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'Private WS' });
    const workspaceId = ws.body.data._id || ws.body.data.id;

    const denied = await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(denied.status).toBe(403);
  });

  it('supports password reset flow without email enumeration', async () => {
    const user = await register('Reset Me', `reset_${Date.now()}@test.com`);
    const forgotUnknown = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });
    expect(forgotUnknown.status).toBe(200);

    const forgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: user.user.email });
    expect(forgot.status).toBe(200);
  });

  it('returns billing plans and free subscription without Stripe', async () => {
    const user = await register('Biller', `bill_${Date.now()}@test.com`);
    const plans = await request(app).get('/api/billing/plans');
    expect(plans.status).toBe(200);
    expect(plans.body.data.length).toBeGreaterThanOrEqual(3);

    const sub = await request(app)
      .get('/api/billing/subscription')
      .set('Authorization', `Bearer ${user.token}`);
    expect(sub.status).toBe(200);
    expect(sub.body.data.planId).toBe('free');
  });

  it('creates channels and threaded messages', async () => {
    const user = await register('Chatter', `chat_${Date.now()}@test.com`);
    const ws = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Chat WS' });
    const workspaceId = ws.body.data._id || ws.body.data.id;

    const channel = await request(app)
      .post(`/api/workspaces/${workspaceId}/channels`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'eng', type: 'PUBLIC' });
    expect(channel.status).toBe(201);
    const channelId = channel.body.data._id;

    const msg = await request(app)
      .post(`/api/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ content: 'Hello thread root' });
    expect(msg.status).toBe(201);

    const reply = await request(app)
      .post(`/api/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ content: 'Reply', parentMessageId: msg.body.data._id });
    expect(reply.status).toBe(201);

    const list = await request(app)
      .get(`/api/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBeGreaterThanOrEqual(1);
  });
});
