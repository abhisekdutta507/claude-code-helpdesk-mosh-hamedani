import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '../../backend');

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

export default async function globalSetup() {
  const testEnv = parseEnvFile(path.join(backendDir, '.env.test'));
  const env = { ...process.env, ...testEnv };

  const bunBin = `${process.env.HOME}/.bun/bin/bun`;
  const bunDir = `${process.env.HOME}/.bun/bin`;
  // Ensure bun is on PATH for child processes spawned by scripts (e.g. seed)
  env.PATH = env.PATH ? `${bunDir}:${env.PATH}` : bunDir;

  // Apply any pending migrations (also creates the DB if it doesn't exist yet)
  console.log('\nApplying migrations to test database…');
  execSync(`${bunBin}x prisma migrate deploy`, {
    cwd: backendDir,
    env,
    stdio: 'inherit',
  });

  // Clear all data so each test run starts from a known state
  console.log('\nTruncating test data…');
  execSync(`${bunBin}x prisma db execute --stdin`, {
    cwd: backendDir,
    env,
    input: 'TRUNCATE TABLE "user", "session", "account", "verification" RESTART IDENTITY CASCADE;',
    stdio: ['pipe', 'inherit', 'inherit'],
  });

  console.log('\nSeeding test database…');
  execSync(`${bunBin} run seed`, {
    cwd: backendDir,
    env,
    stdio: 'inherit',
  });
}
