import { createClient } from '@libsql/client/http';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function backfillStartDate() {
  console.log('Starting startDate backfill...');
  
  // Get all jobs where startDate is NULL or empty
  const result = await client.execute('SELECT id, orderDate FROM job WHERE startDate IS NULL OR startDate = ""');
  const jobs = result.rows;
  
  console.log(`Found ${jobs.length} jobs needing startDate backfill`);
  
  let updated = 0;
  for (const job of jobs) {
    const orderDate = job.orderDate;
    if (orderDate) {
      await client.execute({
        sql: 'UPDATE job SET startDate = ? WHERE id = ?',
        args: [orderDate, job.id],
      });
      updated++;
    }
  }
  
  console.log(`Backfill complete: updated ${updated} jobs`);
}

backfillStartDate().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
