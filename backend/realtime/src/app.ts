import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { RealtimeAuthService } from './services/realtimeAuth.js';

export const app = express();

const allowedOrigins = config.CORS_ORIGIN.split(',').map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'idearelay-realtime',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Foundation endpoint for query sealing (to be expanded in subsequent features)
app.post('/api/realtime/seal', (req: Request, res: Response) => {
  const { userId, organizationId, projectId, tables } = req.body;

  if (!userId || !organizationId || !Array.isArray(tables)) {
    res.status(400).json({
      error: 'Missing required parameters: userId, organizationId, and tables are required',
    });
    return;
  }

  const sealed = RealtimeAuthService.sealSubscriptionQuery({
    userId,
    organizationId,
    projectId,
    tables,
  });

  res.status(200).json(sealed);
});
