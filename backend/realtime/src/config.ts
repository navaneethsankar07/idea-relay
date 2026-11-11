import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('django-insecure-development-secret-key-change-in-production'),
  NEON_DATABASE_URL: z.string().optional().default('postgres://user:password@localhost:5432/idearelay'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration for Realtime service');
}

export const config = parsed.data;
