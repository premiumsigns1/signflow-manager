import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://signflow-nickhodson1.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1OTUxMTMsImlkIjoiNzAwYzk1NTMtMDU3ZC00ZDhmLThmMzktZWJmODM1ODk2NzNlIiwicmlkIjoiYmYyZTY5NzAtMWU3MC00NGU5LTliYTQtMGRiNWZiZWIyODY0In0.SJDZDSxmKEfb-Rs_FW4b0XefLXaFK3JNd5SnbkpIbrlopkCxI1Jn3ueVcv2ILJX4kZCDBhuVS2hx863w5jSKBA'
});

const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
console.log('Tables:', tables.rows.map(r => r.name));

if (tables.rows.some(r => r.name === 'jobs')) {
  const jobs = await client.execute('SELECT COUNT(*) as cnt FROM jobs');
  console.log('Job count:', jobs.rows[0].cnt);
  const sample = await client.execute('SELECT id, displayId, clientName, currentStatus FROM jobs LIMIT 5');
  console.log('Sample jobs:', sample.rows);
} else {
  console.log('No jobs table yet');
}
