
import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  const extension = await client.query(
    "SELECT extname FROM pg_extension WHERE extname = 'btree_gist'"
  );

  const overlaps = await client.query(`
    SELECT a.id AS appointment_a, b.id AS appointment_b
    FROM "Appointment" a
    JOIN "Appointment" b
      ON a."doctorId" = b."doctorId"
     AND a.id < b.id
     AND a."startsAt" < b."endsAt"
     AND a."endsAt" > b."startsAt"
    WHERE a.status IN ('PENDING', 'CONFIRMED')
      AND b.status IN ('PENDING', 'CONFIRMED')
  `);

  console.log('Extension:', extension.rows);
  console.log('Overlapping appointments:', overlaps.rows);
} catch (error) {
  console.error('Database check failed:', error.message);
} finally {
  await client.end().catch(() => {});
}
