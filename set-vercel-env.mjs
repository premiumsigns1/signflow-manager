import { execSync } from 'child_process';
import https from 'https';
import os from 'os';
import path from 'path';
import fs from 'fs';

const TURSO_URL = 'libsql://signflow-nickhodson1.aws-eu-west-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1OTUxMTMsImlkIjoiNzAwYzk1NTMtMDU3ZC00ZDhmLThmMzktZWJmODM1ODk2NzNlIiwicmlkIjoiYmYyZTY5NzAtMWU3MC00NGU5LTliYTQtMGRiNWZiZWIyODY0In0.SJDZDSxmKEfb-Rs_FW4b0XefLXaFK3JNd5SnbkpIbrlopkCxI1Jn3ueVcv2ILJX4kZCDBhuVS2hx863w5jSKBA';
const PROJECT_ID = 'prj_g10zKgNnQIjE8KyovwjGSAkrRk76';
const TEAM_ID = 'team_M3ZIunnakribgVZyjTC3MRCr';

// Find Vercel token from their global config
function findToken() {
  const home = os.homedir();
  const candidates = [
    path.join(home, 'AppData', 'Roaming', 'com.vercel.cli', 'auth.json'),
    path.join(home, 'AppData', 'Local', 'Programs', 'vercel', 'config.json'),
    path.join(home, '.config', 'vercel', 'auth.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      return data.token || data.accessToken;
    }
  }
  // Try env
  return process.env.VERCEL_TOKEN;
}

async function apiRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.vercel.com',
      path: `${path}?teamId=${TEAM_ID}`,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch(e) { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const token = findToken();
  if (!token) {
    console.error('No Vercel token found');
    process.exit(1);
  }
  console.log('Token found, setting env vars...');

  // Delete existing
  const existing = await apiRequest(`/v10/projects/${PROJECT_ID}/env`, 'GET', {}, token);
  if (existing.data.envs) {
    for (const env of existing.data.envs) {
      if (['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'].includes(env.key)) {
        await apiRequest(`/v10/projects/${PROJECT_ID}/env/${env.id}`, 'DELETE', {}, token);
        console.log(`Deleted ${env.key}`);
      }
    }
  }

  // Add clean ones
  const envs = [
    { key: 'TURSO_DATABASE_URL', value: TURSO_URL, type: 'plain', target: ['production', 'preview', 'development'] },
    { key: 'TURSO_AUTH_TOKEN', value: TURSO_TOKEN, type: 'encrypted', target: ['production', 'preview', 'development'] },
  ];

  for (const env of envs) {
    const res = await apiRequest(`/v10/projects/${PROJECT_ID}/env`, 'POST', env, token);
    console.log(`Set ${env.key}:`, res.status, res.data.key || res.data.error?.message);
  }

  console.log('Done! Now redeploying...');
  execSync('npx vercel --prod --yes', { stdio: 'inherit', cwd: 'C:\\Users\\info\\.openclaw\\workspace\\signflow-manager\\client' });
}

main().catch(console.error);
