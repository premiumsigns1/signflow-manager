import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://signflow-nickhodson1.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1OTUxMTMsImlkIjoiNzAwYzk1NTMtMDU3ZC00ZDhmLThmMzktZWJmODM1ODk2NzNlIiwicmlkIjoiYmYyZTY5NzAtMWU3MC00NGU5LTliYTQtMGRiNWZiZWIyODY0In0.SJDZDSxmKEfb-Rs_FW4b0XefLXaFK3JNd5SnbkpIbrlopkCxI1Jn3ueVcv2ILJX4kZCDBhuVS2hx863w5jSKBA'
});

// todos
const todoSchema = await client.execute("PRAGMA table_info(todo)");
console.log('todo columns:', todoSchema.rows.map(r => r.name));
const todos = await client.execute('SELECT * FROM todo ORDER BY createdAt DESC LIMIT 20');
console.log('todo count:', todos.rows.length);
todos.rows.forEach(r => console.log(JSON.stringify(r)));

// referrals
const refSchema = await client.execute("PRAGMA table_info(referral)");
console.log('\nreferral columns:', refSchema.rows.map(r => r.name));
const refs = await client.execute('SELECT * FROM referral ORDER BY createdAt DESC LIMIT 20');
console.log('referral count:', refs.rows.length);
refs.rows.forEach(r => console.log(JSON.stringify(r)));
