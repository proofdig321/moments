import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function testDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Database connected successfully');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query executed:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

testDatabase();