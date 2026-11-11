import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { RealtimeAuthService } from '../services/realtimeAuth';

describe('Realtime Service', () => {
  it('GET /health returns 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('idearelay-realtime');
    expect(res.body.version).toBe('0.1.0');
  });

  it('POST /api/realtime/seal generates a signed token for valid payload', async () => {
    const res = await request(app)
      .post('/api/realtime/seal')
      .send({
        userId: 'usr_123',
        organizationId: 'org_456',
        projectId: 'proj_789',
        tables: ['feedback', 'votes'],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.expiresIn).toBe(3600);

    // Verify token unsealing
    const payload = RealtimeAuthService.verifySubscriptionToken(res.body.token);
    expect(payload.userId).toBe('usr_123');
    expect(payload.organizationId).toBe('org_456');
    expect(payload.tables).toEqual(['feedback', 'votes']);
  });

  it('POST /api/realtime/seal rejects payload when parameters are missing', async () => {
    const res = await request(app)
      .post('/api/realtime/seal')
      .send({
        userId: 'usr_123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
