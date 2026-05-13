import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../backend/.env.test');

function parseEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
  return env;
}

interface Credentials {
  email: string;
  password: string;
}

const env = parseEnvFile(envPath);

export const apiBaseUrl = env.BETTER_AUTH_URL ?? 'http://localhost:3001';

export const testUsers = {
  admin: {
    email: env.SEED_ADMIN_EMAIL,
    password: env.SEED_ADMIN_PASSWORD,
  },
  agent1: {
    email: env.SEED_AGENT1_EMAIL,
    password: env.SEED_AGENT1_PASSWORD,
  },
} satisfies Record<string, Credentials>;
