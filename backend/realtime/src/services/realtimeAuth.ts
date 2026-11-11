import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface RealtimeSubscriptionPayload {
  userId: string;
  organizationId: string;
  projectId?: string;
  tables: string[];
}

export interface SealedQueryToken {
  token: string;
  expiresIn: number;
}

export class RealtimeAuthService {
  /**
   * Seals a query subscription by creating a signed token authorizing
   * the client to subscribe to specified tenant/project streams.
   */
  public static sealSubscriptionQuery(
    payload: RealtimeSubscriptionPayload,
    expiresInSeconds: number = 3600
  ): SealedQueryToken {
    const token = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: expiresInSeconds,
      algorithm: 'HS256',
    });

    return {
      token,
      expiresIn: expiresInSeconds,
    };
  }

  /**
   * Verifies and unwraps a sealed query subscription token.
   */
  public static verifySubscriptionToken(token: string): RealtimeSubscriptionPayload {
    return jwt.verify(token, config.JWT_SECRET) as RealtimeSubscriptionPayload;
  }
}
